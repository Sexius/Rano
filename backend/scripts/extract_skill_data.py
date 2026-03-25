"""
스킬 데이터 자동 추출기 (배율 + 타수)
skilldescript.lub 바이너리 파일에서 자동 추출

추출 대상:
1. 배율 (damage_percent): "ATK 6200%", "ATK 1회당 3800%" 등
2. 타수 (hits): "5회 준다", "7회 입힌다" 등

로직:
- 스킬 이름으로 파일 내 위치 검색
- 주변 텍스트에서 패턴 매칭
- 최대 레벨(Lv10, Lv5 등) 기준 가장 높은 배율 선택
"""
import pymysql
import re

FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"

def get_db():
    return pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')

def run():
    print("🚀 스킬 데이터 자동 추출 시작...")
    print("=" * 60)
    
    # 파일 로드
    try:
        with open(FILE_PATH, 'rb') as f:
            content = f.read()
        print(f"✅ 파일 로드: {len(content):,} bytes")
    except FileNotFoundError:
        print(f"❌ 파일 없음: {FILE_PATH}")
        return

    conn = get_db()
    cursor = conn.cursor()
    
    # 패턴 정의 (CP949 인코딩)
    # ATK 패턴: "ATK 숫자%", "ATK 1회당 숫자%"
    atk_pattern = re.compile(rb'ATK[^\d]*(\d+)%')
    
    # 타수 패턴: "숫자회", "숫자연타"
    byte_hoe = '회'.encode('cp949')
    byte_yeonta = '연타'.encode('cp949')
    hits_pattern = re.compile(rb'(\d+)\s*(' + re.escape(byte_hoe) + rb'|' + re.escape(byte_yeonta) + rb')')
    
    # DB에서 스킬 목록 가져오기
    cursor.execute("SELECT eng_name, name_kr, damage_percent, hits FROM skills WHERE damage_percent > 0")
    skills = cursor.fetchall()
    
    update_count = 0
    issues = []
    
    print(f"\n📋 총 {len(skills)}개 스킬 분석 중...\n")
    
    for eng_name, name_kr, current_dmg, current_hits in skills:
        if not name_kr:
            continue
            
        # 한글 이름을 CP949로 인코딩
        try:
            name_bytes = name_kr.encode('cp949')
        except:
            continue
        
        # 파일에서 스킬 이름 위치 찾기
        start_idx = content.find(name_bytes)
        if start_idx == -1:
            continue
        
        # 이름 주변 1500바이트 검색 (레벨별 정보가 길 수 있음)
        search_area = content[start_idx : start_idx + 2000]
        
        # === 배율 추출 ===
        atk_matches = atk_pattern.findall(search_area)
        new_dmg = current_dmg
        if atk_matches:
            # 가장 큰 값 = 최대 레벨 배율
            atk_values = [int(m) for m in atk_matches if 100 < int(m) <= 30000]
            if atk_values:
                new_dmg = max(atk_values)
        
        # === 타수 추출 ===
        hits_matches = hits_pattern.findall(search_area)
        new_hits = current_hits if current_hits and current_hits > 0 else 1
        if hits_matches:
            # "1회당"은 제외하고, 실제 타수만 추출
            hits_values = [int(m[0]) for m in hits_matches if 1 < int(m[0]) <= 50]
            if hits_values:
                new_hits = max(hits_values)
        
        # 변경이 있으면 업데이트
        if new_dmg != current_dmg or new_hits != current_hits:
            cursor.execute(
                "UPDATE skills SET damage_percent = %s, hits = %s WHERE eng_name = %s",
                (new_dmg, new_hits, eng_name)
            )
            update_count += 1
            
            # 주요 스킬 로그
            if eng_name in ['ABC_CHASING_BREAK', 'ABC_DEFT_STAB', 'MT_RUSH_STRIKE', 'ABC_ABYSS_DAGGER', 'ABC_FRENETIC_HOMERUN']:
                print(f"✨ {name_kr}: {current_dmg}%×{current_hits}회 → {new_dmg}%×{new_hits}회")
        
        # 검증: 배율이 여전히 낮으면 문제 플래그
        if new_dmg < 500 and 'ABC_' in eng_name:
            issues.append(f"⚠️ {name_kr}: 배율이 낮음 ({new_dmg}%)")

    conn.commit()
    conn.close()
    
    print(f"\n{'=' * 60}")
    print(f"🎉 업데이트 완료: {update_count}개 스킬")
    
    if issues:
        print(f"\n⚠️ 확인 필요: {len(issues)}개")
        for issue in issues[:10]:
            print(f"  {issue}")

if __name__ == "__main__":
    run()
