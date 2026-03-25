"""
개선된 스킬 데이터 파싱 스크립트

문제점:
1. 기존 스크립트는 "ATK XXX%" 패턴만 찾아서 다른 형식의 배율 누락
2. 타수 파싱 로직이 색상코드(^777777)를 숫자로 오인

개선:
1. 다양한 배율 표기 패턴 추가: "데미지 XXX%", "MATK XXX%", "위력 XXX%"
2. 타수 파싱 시 색상코드 제거 후 파싱
3. 한글 "회" 앞의 숫자만 타수로 인식
"""
import pymysql
import re
import os

FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"
DB_PASSWORD = "1234"

def get_db_connection():
    return pymysql.connect(
        host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4'
    )

def clean_color_codes(text):
    """RO 색상 코드 (^RRGGBB) 제거"""
    return re.sub(r'\^[0-9a-fA-F]{6}', '', text)

def extract_damage_percent(block):
    """다양한 패턴에서 데미지 배율 추출"""
    # 색상 코드 제거
    clean_block = clean_color_codes(block)
    
    patterns = [
        r'ATK[:\s]*(\d+)%',           # ATK 3800%
        r'MATK[:\s]*(\d+)%',          # MATK 3800%
        r'데미지[:\s]*(\d+)%',         # 데미지 3800%
        r'위력[:\s]*(\d+)%',           # 위력 3800%
        r'공격력[:\s]*(\d+)%',         # 공격력 3800%
        r'(\d{3,})%\s*(?:×|x|\*)',    # 3800% x 7
        r'(?:스킬|물리|마법)\s*(\d{3,})%', # 스킬 3800%
    ]
    
    all_matches = []
    for pattern in patterns:
        matches = re.findall(pattern, clean_block, re.IGNORECASE)
        all_matches.extend([int(m) for m in matches if int(m) > 100])
    
    if all_matches:
        return max(all_matches)
    
    # 마지막 시도: 3자리 이상 숫자 + % 일반 패턴
    general_matches = re.findall(r'(\d{3,})%', clean_block)
    if general_matches:
        # 색상코드 숫자 제외 (77777XX 패턴)
        valid = [int(m) for m in general_matches if not m.startswith('777777')]
        if valid:
            return max(valid)
    
    return 0

def extract_hits(block):
    """타수 추출 (색상코드 제외)"""
    clean_block = clean_color_codes(block)
    
    patterns = [
        r'(\d+)\s*회\s*(?:공격|타격|연타|발동)',  # 7회 공격
        r'(\d+)\s*회',                          # 7회
        r'×\s*(\d+)',                          # × 7
        r'x\s*(\d+)\s*(?:회|hit)',              # x 7회, x 7 hit
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, clean_block, re.IGNORECASE)
        if matches:
            hits = [int(m) for m in matches if 1 < int(m) <= 50]  # 1~50 사이만 유효
            if hits:
                return max(hits)
    
    return 1

def run():
    print(f"📂 파일 읽는 중: {FILE_PATH}")
    
    if not os.path.exists(FILE_PATH):
        print("❌ 파일을 찾을 수 없습니다.")
        return
    
    # 파일 읽기
    try:
        with open(FILE_PATH, 'rb') as f:
            raw = f.read()
        # 여러 인코딩 시도
        for enc in ['cp949', 'euc-kr', 'utf-8']:
            try:
                content = raw.decode(enc)
                print(f"✅ {enc} 인코딩으로 읽기 성공 ({len(content)} chars)")
                break
            except:
                continue
        else:
            print("❌ 인코딩 실패")
            return
    except Exception as e:
        print(f"❌ 파일 읽기 실패: {e}")
        return
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 스킬 블록 파싱
    skill_blocks = re.split(r'\[SKID\.', content)
    print(f"🔍 {len(skill_blocks)}개 스킬 블록 분석...")
    
    updated = 0
    report = []
    
    for block in skill_blocks:
        if not block.strip():
            continue
        
        # 스킬 ID 추출
        id_match = re.match(r'([A-Z0-9_]+)\]', block)
        if not id_match:
            continue
        
        eng_name = id_match.group(1)
        
        # 배율과 타수 추출
        dmg = extract_damage_percent(block)
        hits = extract_hits(block)
        
        if dmg > 100 or hits > 1:
            # DB 업데이트
            if dmg > 100:
                cursor.execute("UPDATE skills SET damage_percent = %s WHERE eng_name = %s AND damage_percent <= 100", (dmg, eng_name))
            if hits > 1:
                cursor.execute("UPDATE skills SET hits = %s WHERE eng_name = %s AND (hits = 1 OR hits > 100)", (hits, eng_name))
            
            if cursor.rowcount > 0:
                updated += 1
                report.append(f"{eng_name}: {dmg}% x {hits}회")
    
    conn.commit()
    
    # 결과 저장
    with open('reparse_report.txt', 'w', encoding='utf-8') as f:
        f.write(f"업데이트된 스킬: {updated}개\n\n")
        for line in report:
            f.write(line + "\n")
    
    print(f"\n🎉 완료! {updated}개 스킬 업데이트")
    print("📄 상세 결과: reparse_report.txt")
    
    # 주요 스킬 확인
    print("\n📊 주요 스킬 확인:")
    target = ['ABC_CHASING_BREAK', 'ABC_DEFT_STAB', 'HN_NAPALM_VULCAN_STRIKE', 'SKE_SKY_MOON']
    for s in target:
        cursor.execute("SELECT name_kr, damage_percent, hits FROM skills WHERE eng_name = %s", (s,))
        r = cursor.fetchone()
        if r:
            print(f"   {r[0]}: {r[1]}% x {r[2]}회")
    
    conn.close()

if __name__ == "__main__":
    run()
