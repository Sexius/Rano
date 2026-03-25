"""
스킬 데이터 자동 추출기 v3
- 영문 스킬 ID로 검색
- 색상코드 필터링
- [Lv X] 패턴으로 최고 레벨 배율 선택
"""
import pymysql
import re

FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"
OUTPUT_PATH = "skill_extract_v3_result.txt"

def get_db():
    return pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')

def run():
    with open(FILE_PATH, 'rb') as f:
        content = f.read()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT eng_name, name_kr, damage_percent, hits 
        FROM skills 
        WHERE eng_name LIKE 'ABC_%' OR eng_name LIKE 'MT_%'
    """)
    skills = cursor.fetchall()
    
    results = []
    update_count = 0
    
    for eng_name, name_kr, current_dmg, current_hits in skills:
        eng_bytes = eng_name.encode('ascii')
        idx = content.find(eng_bytes)
        
        if idx == -1:
            continue
        
        # 다음 스킬까지만 검색
        end_idx = min(idx + 1500, len(content))
        next_skill = re.search(rb'\n(ABC_|MT_)[A-Z_]+\.\.', content[idx + len(eng_bytes):end_idx])
        if next_skill:
            end_idx = idx + len(eng_bytes) + next_skill.start()
        
        chunk = content[idx:end_idx]
        
        try:
            text = chunk.decode('cp949', errors='replace')
            # 색상코드 제거
            text = re.sub(r'\^[0-9A-Fa-f]{6}', '', text)
        except:
            continue
        
        # === 배율 추출 (최고 레벨 기준) ===
        # 패턴: [Lv 5] : 1회당 ATK 3800%/ 4250%(체이싱)
        # 또는: [Lv10] : 1회당 ATK 6200%
        
        new_dmg = current_dmg
        
        # 레벨별 배율 찾기
        level_pattern = r'\[Lv\s*(\d+)\]\s*[:\s]*.*?ATK\s*(\d+)%'
        level_matches = re.findall(level_pattern, text, re.IGNORECASE)
        
        if level_matches:
            # 최고 레벨의 배율 선택
            max_level_match = max(level_matches, key=lambda x: int(x[0]))
            new_dmg = int(max_level_match[1])
        else:
            # 레벨 패턴 없으면 기존 방식 (최대값)
            atk_matches = re.findall(r'ATK\s*[^\d]*?(\d{3,5})%', text)
            if atk_matches:
                valid = [int(m) for m in atk_matches if 100 < int(m) <= 30000]
                if valid:
                    new_dmg = max(valid)
        
        # === 타수 추출 ===
        new_hits = current_hits if current_hits and current_hits > 0 else 1
        hits_context = re.findall(r'(\d+)회\s*(입힌다|준다|공격한다)', text)
        if hits_context:
            valid = [int(m[0]) for m in hits_context if 1 < int(m[0]) <= 50]
            if valid:
                new_hits = max(valid)
        
        # 업데이트
        if new_dmg != current_dmg or new_hits != current_hits:
            cursor.execute(
                "UPDATE skills SET damage_percent = %s, hits = %s WHERE eng_name = %s",
                (new_dmg, new_hits, eng_name)
            )
            update_count += 1
            results.append(f"✅ {name_kr or eng_name}: {current_dmg}%×{current_hits}회 → {new_dmg}%×{new_hits}회")
        else:
            results.append(f"   {name_kr or eng_name}: {new_dmg}%×{new_hits}회")
    
    conn.commit()
    conn.close()
    
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write("스킬 데이터 자동 추출 v3 결과\n")
        f.write("=" * 60 + "\n\n")
        for r in results:
            f.write(r + "\n")
        f.write(f"\n총 {update_count}개 업데이트됨")
    
    print(f"✅ {OUTPUT_PATH}")
    print(f"📊 업데이트: {update_count}개")

if __name__ == "__main__":
    run()
