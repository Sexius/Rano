"""
바이너리 모드 스킬 파싱 스크립트
- 인코딩 문제 우회
"""
import pymysql
import re
import os

FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"
DB_PASSWORD = "1234"

def run():
    print(f"📂 파일 읽는 중: {FILE_PATH}")
    
    if not os.path.exists(FILE_PATH):
        print("❌ 파일 없음")
        return
    
    # 바이너리로 읽기
    with open(FILE_PATH, 'rb') as f:
        raw = f.read()
    
    print(f"✅ 파일 읽기 완료 ({len(raw)} bytes)")
    
    conn = pymysql.connect(host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4')
    cursor = conn.cursor()
    
    # 스킬 ID 추출 패턴 (바이너리)
    # [SKID.ABC_CHASING_BREAK]
    skill_pattern = rb'\[SKID\.([A-Z0-9_]+)\]'
    
    # ATK 패턴 (바이너리)
    atk_pattern = rb'ATK\s*(\d+)%'
    matk_pattern = rb'MATK\s*(\d+)%'
    
    # 타수 패턴 - "회" = \xc8\xb8 (CP949)
    hits_pattern = rb'(\d+)\s*\xc8\xb8'
    
    # 스킬 블록 분할
    blocks = re.split(rb'\[SKID\.', raw)
    print(f"🔍 {len(blocks)}개 블록 분석...")
    
    updated_dmg = 0
    updated_hits = 0
    report = []
    
    for block in blocks:
        if not block:
            continue
        
        # 스킬 ID
        id_match = re.match(rb'([A-Z0-9_]+)\]', block)
        if not id_match:
            continue
        eng_name = id_match.group(1).decode('ascii')
        
        # 배율 추출
        dmg = 0
        for pattern in [atk_pattern, matk_pattern]:
            matches = re.findall(pattern, block, re.IGNORECASE)
            if matches:
                vals = [int(m) for m in matches]
                dmg = max(dmg, max(vals))
        
        # 일반 % 패턴 (3자리 이상)
        if dmg == 0:
            gen_matches = re.findall(rb'(\d{3,})%', block)
            if gen_matches:
                # 77777XX 색상코드 제외
                valid = [int(m) for m in gen_matches if not m.startswith(b'777777') and int(m) > 100]
                if valid:
                    dmg = max(valid)
        
        # 타수 추출
        hits = 1
        hits_matches = re.findall(hits_pattern, block)
        if hits_matches:
            vals = [int(m) for m in hits_matches if 1 < int(m) <= 50]
            if vals:
                hits = max(vals)
        
        # DB 업데이트
        if dmg > 100:
            cursor.execute(
                "UPDATE skills SET damage_percent = %s WHERE eng_name = %s AND (damage_percent = 100 OR damage_percent < %s)",
                (dmg, eng_name, dmg)
            )
            if cursor.rowcount > 0:
                updated_dmg += 1
                report.append(f"DMG {eng_name}: {dmg}%")
        
        if hits > 1:
            cursor.execute(
                "UPDATE skills SET hits = %s WHERE eng_name = %s AND (hits = 1 OR hits > 100)",
                (hits, eng_name)
            )
            if cursor.rowcount > 0:
                updated_hits += 1
                report.append(f"HITS {eng_name}: {hits}회")
    
    conn.commit()
    
    # 리포트 저장
    with open('binary_parse_report.txt', 'w', encoding='utf-8') as f:
        f.write(f"배율 업데이트: {updated_dmg}개\n")
        f.write(f"타수 업데이트: {updated_hits}개\n\n")
        for line in report:
            f.write(line + "\n")
    
    print(f"\n🎉 완료!")
    print(f"   배율 업데이트: {updated_dmg}개")
    print(f"   타수 업데이트: {updated_hits}개")
    print(f"📄 상세: binary_parse_report.txt")
    
    # 확인
    print("\n📊 주요 스킬:")
    for s in ['ABC_CHASING_BREAK', 'ABC_DEFT_STAB', 'HN_NAPALM_VULCAN_STRIKE']:
        cursor.execute("SELECT name_kr, damage_percent, hits FROM skills WHERE eng_name=%s", (s,))
        r = cursor.fetchone()
        if r:
            print(f"   {r[0]}: {r[1]}% x {r[2]}회")
    
    conn.close()

if __name__ == "__main__":
    run()
