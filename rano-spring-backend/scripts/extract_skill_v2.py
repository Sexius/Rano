"""
스킬 데이터 자동 추출기 v2
- 영문 스킬 ID (ABC_XXX)로 검색
- 색상코드(^777777) 필터링
- 레벨별 ATK% 파싱
"""
import pymysql
import re

FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"
OUTPUT_PATH = "skill_extract_result.txt"

def get_db():
    return pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')

def run():
    # 파일 로드
    with open(FILE_PATH, 'rb') as f:
        content = f.read()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 4차 직업 스킬 조회
    cursor.execute("""
        SELECT eng_name, name_kr, damage_percent, hits 
        FROM skills 
        WHERE eng_name LIKE 'ABC_%' OR eng_name LIKE 'MT_%'
    """)
    skills = cursor.fetchall()
    
    results = []
    update_count = 0
    
    for eng_name, name_kr, current_dmg, current_hits in skills:
        # 영문 이름으로 검색 (더 정확함)
        eng_bytes = eng_name.encode('ascii')
        idx = content.find(eng_bytes)
        
        if idx == -1:
            continue
        
        # 이름 뒤 1500바이트 검색 (다음 스킬 시작 전까지)
        end_idx = min(idx + 1500, len(content))
        
        # 다음 스킬 ID 시작점 찾기 (ABC_ 또는 MT_로 시작하는 다음 ID)
        next_skill_match = re.search(rb'\n(ABC_|MT_)', content[idx + len(eng_bytes):end_idx])
        if next_skill_match:
            end_idx = idx + len(eng_bytes) + next_skill_match.start()
        
        chunk = content[idx:end_idx]
        
        # CP949 디코딩 + 색상코드 제거
        try:
            text = chunk.decode('cp949', errors='replace')
            # 색상코드 제거: ^XXXXXX
            text = re.sub(r'\^[0-9A-Fa-f]{6}', '', text)
        except:
            continue
        
        # ATK 패턴: "1회당 ATK 숫자%" 또는 "ATK + 숫자%"
        atk_matches = re.findall(r'ATK\s*[^\d]*?(\d{3,5})%', text)
        new_dmg = current_dmg
        if atk_matches:
            # 숫자로 변환 후 100보다 크고 30000 이하인 값만
            valid_atk = [int(m) for m in atk_matches if 100 < int(m) <= 30000]
            if valid_atk:
                # 최대값 = 최고 레벨 배율
                new_dmg = max(valid_atk)
        
        # 타수 패턴: "숫자회 입힌다" 또는 "숫자회 준다"
        # 주의: "1회당"은 제외
        hits_context = re.findall(r'(\d+)회\s*(입힌다|준다|공격)', text)
        new_hits = current_hits if current_hits and current_hits > 0 else 1
        if hits_context:
            valid_hits = [int(m[0]) for m in hits_context if 1 < int(m[0]) <= 50]
            if valid_hits:
                new_hits = max(valid_hits)
        
        # 결과 기록
        if new_dmg != current_dmg or new_hits != current_hits:
            cursor.execute(
                "UPDATE skills SET damage_percent = %s, hits = %s WHERE eng_name = %s",
                (new_dmg, new_hits, eng_name)
            )
            update_count += 1
            results.append(f"✅ {name_kr or eng_name}: {current_dmg}%×{current_hits}회 → {new_dmg}%×{new_hits}회")
        else:
            results.append(f"   {name_kr or eng_name}: {new_dmg}%×{new_hits}회 (변경없음)")
    
    conn.commit()
    conn.close()
    
    # 결과 저장
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write("스킬 데이터 자동 추출 결과\n")
        f.write("=" * 60 + "\n\n")
        for r in results:
            f.write(r + "\n")
        f.write(f"\n총 {update_count}개 업데이트됨")
    
    print(f"✅ 결과 저장: {OUTPUT_PATH}")
    print(f"📊 업데이트: {update_count}개")

if __name__ == "__main__":
    run()
