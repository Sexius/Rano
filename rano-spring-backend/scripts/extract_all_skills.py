"""
전체 스킬 데이터 자동 추출기
모든 1344개 스킬 대상
"""
import pymysql
import re

FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"
OUTPUT_PATH = "full_skill_extraction_report.txt"

def get_db():
    return pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')

def extract_data(content, eng_name, name_kr):
    """스킬 데이터 추출 (영문 ID 또는 한글 이름으로 검색)"""
    
    # 1차: 영문 ID로 검색
    idx = -1
    try:
        eng_bytes = eng_name.encode('ascii')
        idx = content.find(eng_bytes)
    except:
        pass
    
    # 2차: 한글 이름으로 검색
    if idx == -1 and name_kr:
        try:
            kr_bytes = name_kr.encode('cp949')
            idx = content.find(kr_bytes)
        except:
            pass
    
    if idx == -1:
        return None, None
    
    # 검색 범위 설정 (다음 스킬까지)
    end_idx = min(idx + 1200, len(content))
    chunk = content[idx:end_idx]
    
    try:
        text = chunk.decode('cp949', errors='replace')
        text = re.sub(r'\^[0-9A-Fa-f]{6}', '', text)  # 색상코드 제거
    except:
        return None, None
    
    # 배율 추출
    extracted_dmg = None
    
    # 패턴 1: [Lv X] : 1회당 ATK 숫자%
    level_matches = re.findall(r'\[Lv\s*(\d+)\]\s*[:\s]*.*?ATK\s*(\d+)%', text, re.IGNORECASE)
    if level_matches:
        max_match = max(level_matches, key=lambda x: int(x[0]))
        extracted_dmg = int(max_match[1])
    else:
        # 패턴 2: ATK + 숫자%
        atk_matches = re.findall(r'ATK\s*[+]?\s*(\d{3,5})%', text)
        if atk_matches:
            valid = [int(m) for m in atk_matches if 100 < int(m) <= 50000]
            if valid:
                extracted_dmg = max(valid)
    
    # 타수 추출
    extracted_hits = None
    hits_matches = re.findall(r'(\d+)회\s*(입힌다|준다|공격|적중)', text)
    if hits_matches:
        valid = [int(m[0]) for m in hits_matches if 1 < int(m[0]) <= 100]
        if valid:
            extracted_hits = max(valid)
    
    return extracted_dmg, extracted_hits

def run():
    print("🚀 전체 스킬 데이터 추출 시작...")
    
    with open(FILE_PATH, 'rb') as f:
        content = f.read()
    print(f"📁 파일 로드: {len(content):,} bytes")
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 모든 스킬 조회
    cursor.execute("SELECT eng_name, name_kr, damage_percent, hits FROM skills")
    skills = cursor.fetchall()
    print(f"📊 총 스킬: {len(skills)}개")
    
    updated = 0
    found = 0
    
    for eng_name, name_kr, db_dmg, db_hits in skills:
        extracted_dmg, extracted_hits = extract_data(content, eng_name, name_kr)
        
        if extracted_dmg is not None:
            found += 1
            
            new_dmg = extracted_dmg
            new_hits = extracted_hits if extracted_hits else (db_hits if db_hits else 1)
            
            # DB와 다르면 업데이트
            if new_dmg != db_dmg or new_hits != db_hits:
                cursor.execute(
                    "UPDATE skills SET damage_percent = %s, hits = %s WHERE eng_name = %s",
                    (new_dmg, new_hits, eng_name)
                )
                updated += 1
    
    conn.commit()
    conn.close()
    
    print(f"\n✅ 완료!")
    print(f"   📊 배율 발견: {found}개")
    print(f"   🔄 업데이트: {updated}개")
    
    # 리포트 저장
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(f"전체 스킬 추출 결과\n")
        f.write(f"총 스킬: {len(skills)}개\n")
        f.write(f"배율 발견: {found}개\n")
        f.write(f"업데이트: {updated}개\n")

if __name__ == "__main__":
    run()
