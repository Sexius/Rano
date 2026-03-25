import pymysql
import re

# ==========================================
# [설정] 파일 경로 (사용자님 경로)
# ==========================================
FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"
DB_PASSWORD = "1234"
# ==========================================

def get_db_connection():
    return pymysql.connect(
        host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4'
    )

def run():
    print("🚀 스킬 타수(Hits) 추출 시작...")
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. hits 컬럼 추가
    try:
        cursor.execute("ALTER TABLE skills ADD COLUMN hits INT DEFAULT 1")
        conn.commit()
        print("✅ hits 컬럼 추가 완료")
    except:
        print("ℹ️ hits 컬럼이 이미 존재합니다.")

    # 2. 파일 읽기 (바이너리)
    with open(FILE_PATH, 'rb') as f:
        content = f.read()

    print(f"✅ 파일 로드 완료 ({len(content)} bytes)")

    # 3. 스킬 조회
    cursor.execute("SELECT eng_name, name_kr FROM skills")
    skills = cursor.fetchall()
    
    count = 0
    
    # "회 입힌다", "연타", "회 공격" 등을 찾는 정규식 (CP949 인코딩 고려)
    # "회" = \xc8\xb8, "연타" = \xbf\xac\xc5\xb8
    # 숫자 + 공백(옵션) + 회/연타
    pattern_hits = re.compile(rb'(\d+)\s*(\xc8\xb8|\xbf\xac\xc5\xb8)')

    for eng_name, name_kr in skills:
        if not name_kr: continue
        
        try:
            target_bytes = name_kr.encode('cp949')
        except:
            continue

        start_idx = content.find(target_bytes)
        if start_idx != -1:
            # 설명글 영역 (대략 500바이트)
            search_area = content[start_idx : start_idx + 800]
            
            # 타수 찾기
            matches = pattern_hits.findall(search_area)
            if matches:
                # 여러 숫자가 나오면 그 중 가장 큰 값을 타수로 간주 (보통 마스터 레벨 타수)
                # 예: 1레벨 3회, 5레벨 7회 -> 7회 선택
                hits_found = [int(m[0]) for m in matches]
                max_hits = max(hits_found)
                
                if max_hits > 1:
                    cursor.execute("UPDATE skills SET hits = %s WHERE eng_name = %s", (max_hits, eng_name))
                    count += 1
                    
                    if eng_name in ['ABC_CHASING_BREAK', 'ABC_DEFT_STAB', 'MT_RUSH_STRIKE']:
                        print(f"✨ [타수 발견] {name_kr}: {max_hits}회")

    conn.commit()
    conn.close()
    print(f"\n🎉 총 {count}개 스킬의 타수 정보를 업데이트했습니다!")

if __name__ == "__main__":
    run()
