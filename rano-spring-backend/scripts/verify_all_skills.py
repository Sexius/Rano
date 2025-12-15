"""
전체 스킬 데이터 검증 스크립트
skilldescript.lub에서 추출한 값과 DB 값 비교
"""
import pymysql
import re

FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"
OUTPUT_PATH = "skill_verification_report.txt"

def get_db():
    return pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')

def extract_skill_data(content, eng_name):
    """스킬 데이터 추출"""
    eng_bytes = eng_name.encode('ascii')
    idx = content.find(eng_bytes)
    
    if idx == -1:
        return None, None, None
    
    # 다음 스킬까지만 검색
    end_idx = min(idx + 1500, len(content))
    next_skill = re.search(rb'\n(ABC_|MT_)[A-Z_]+\.\.', content[idx + len(eng_bytes):end_idx])
    if next_skill:
        end_idx = idx + len(eng_bytes) + next_skill.start()
    
    chunk = content[idx:end_idx]
    
    try:
        text = chunk.decode('cp949', errors='replace')
        text = re.sub(r'\^[0-9A-Fa-f]{6}', '', text)  # 색상코드 제거
    except:
        return None, None, None
    
    # 배율 추출 (최고 레벨)
    level_pattern = r'\[Lv\s*(\d+)\]\s*[:\s]*.*?ATK\s*(\d+)%'
    level_matches = re.findall(level_pattern, text, re.IGNORECASE)
    
    extracted_dmg = None
    if level_matches:
        max_level_match = max(level_matches, key=lambda x: int(x[0]))
        extracted_dmg = int(max_level_match[1])
    else:
        atk_matches = re.findall(r'ATK\s*[^\d]*?(\d{3,5})%', text)
        if atk_matches:
            valid = [int(m) for m in atk_matches if 100 < int(m) <= 30000]
            if valid:
                extracted_dmg = max(valid)
    
    # 타수 추출
    extracted_hits = None
    hits_context = re.findall(r'(\d+)회\s*(입힌다|준다|공격)', text)
    if hits_context:
        valid = [int(m[0]) for m in hits_context if 1 < int(m[0]) <= 50]
        if valid:
            extracted_hits = max(valid)
    
    return extracted_dmg, extracted_hits, text[:200]

def run():
    with open(FILE_PATH, 'rb') as f:
        content = f.read()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 모든 4차 스킬 조회
    cursor.execute("""
        SELECT eng_name, name_kr, damage_percent, hits 
        FROM skills 
        WHERE (eng_name LIKE 'ABC_%' OR eng_name LIKE 'MT_%')
        AND damage_percent > 0
        ORDER BY damage_percent DESC
    """)
    skills = cursor.fetchall()
    conn.close()
    
    issues = []
    verified = []
    cannot_verify = []
    
    for eng_name, name_kr, db_dmg, db_hits in skills:
        extracted_dmg, extracted_hits, sample = extract_skill_data(content, eng_name)
        
        if extracted_dmg is None:
            cannot_verify.append(f"❓ {name_kr}: 파일에서 배율 찾을 수 없음 (DB: {db_dmg}%×{db_hits}회)")
            continue
        
        # 비교
        dmg_match = (abs(db_dmg - extracted_dmg) / max(db_dmg, 1)) < 0.1  # 10% 오차 허용
        hits_match = (db_hits == extracted_hits) if extracted_hits else True
        
        if dmg_match and hits_match:
            verified.append(f"✅ {name_kr}: {db_dmg}%×{db_hits}회")
        else:
            issue = f"⚠️ {name_kr}: DB={db_dmg}%×{db_hits}회, 파일={extracted_dmg}%×{extracted_hits}회"
            issues.append(issue)
    
    # 리포트 작성
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("스킬 데이터 검증 리포트\n")
        f.write("=" * 60 + "\n\n")
        
        f.write(f"📊 총 스킬: {len(skills)}개\n")
        f.write(f"✅ 검증 완료: {len(verified)}개\n")
        f.write(f"⚠️ 불일치: {len(issues)}개\n")
        f.write(f"❓ 확인 불가: {len(cannot_verify)}개\n\n")
        
        if issues:
            f.write("=" * 60 + "\n")
            f.write("⚠️ 불일치 스킬 (수정 필요)\n")
            f.write("=" * 60 + "\n")
            for issue in issues:
                f.write(issue + "\n")
            f.write("\n")
        
        if cannot_verify:
            f.write("=" * 60 + "\n")
            f.write("❓ 확인 불가 스킬\n")
            f.write("=" * 60 + "\n")
            for item in cannot_verify:
                f.write(item + "\n")
            f.write("\n")
        
        f.write("=" * 60 + "\n")
        f.write("✅ 검증 완료 스킬\n")
        f.write("=" * 60 + "\n")
        for item in verified:
            f.write(item + "\n")
    
    print(f"✅ 리포트 저장: {OUTPUT_PATH}")
    print(f"   검증: {len(verified)}개 / 불일치: {len(issues)}개 / 확인불가: {len(cannot_verify)}개")

if __name__ == "__main__":
    run()
