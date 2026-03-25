import pymysql
import re

# ==========================================
# [설정] 파일 경로 (사용자님 경로 그대로)
# ==========================================
FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"
DB_PASSWORD = "1234"
# ==========================================

def get_db_connection():
    return pymysql.connect(
        host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4'
    )

def run():
    print("🚀 스킬 배율 바이너리 채굴 시작...")
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. DB에 컬럼 확인/추가
    try:
        cursor.execute("ALTER TABLE skills ADD COLUMN damage_percent INT DEFAULT 100")
        conn.commit()
    except:
        pass # 이미 있으면 패스

    # 2. 파일 바이너리 모드로 통째로 읽기
    try:
        with open(FILE_PATH, 'rb') as f:
            content = f.read()
    except FileNotFoundError:
        print("❌ 파일을 찾을 수 없습니다. 경로를 확인해주세요.")
        return

    print(f"✅ 파일 로드 완료 ({len(content)} bytes)")

    # 3. DB에서 스킬 목록 가져오기
    cursor.execute("SELECT eng_name, name_kr, max_level FROM skills")
    skills = cursor.fetchall()
    
    updated_count = 0

    # 4. 스킬 하나씩 순회하며 파일 뒤지기
    for eng_name, name_kr, max_lv in skills:
        if not name_kr: continue

        # (1) 한글 이름을 CP949 바이너리로 변환
        try:
            target_bytes = name_kr.encode('cp949')
        except:
            continue # 인코딩 안되는 글자는 패스

        # (2) 파일 내에서 해당 한글 이름의 위치 찾기
        # 파일 전체에서 검색 (여러 개 나올 수 있음, 첫 번째 혹은 루프)
        start_idx = content.find(target_bytes)
        
        if start_idx != -1:
            # (3) 찾은 위치부터 뒤로 500바이트 정도만 뚝 떼어내서 분석 (검색 범위 제한)
            search_area = content[start_idx : start_idx + 1000]
            
            # (4) "ATK 숫자%" 패턴 찾기 (바이트 정규식)
            # 패턴: ATK (공백) 숫자 %
            # 대소문자 무시 (?i) 플래그 대신 [aA][tT][kK] 사용
            pattern = re.compile(rb'[A-Za-z]+\s*[:]?\s*(\d+)\s*[%]', re.IGNORECASE)
            
            matches = pattern.findall(search_area)
            
            final_dmg = 0
            if matches:
                # 여러 숫자가 나오면 (1레벨, 2레벨...) 그 중 가장 큰 값(마스터 레벨) 선택
                # 단, 너무 터무니없는 숫자(99999 등)는 제외하거나 로직 조정 가능
                damages = [int(m) for m in matches]
                if damages:
                    final_dmg = max(damages)

            # (5) DB 업데이트
            if final_dmg > 100: # 100% 초과인 경우만 유의미하다고 판단
                cursor.execute("UPDATE skills SET damage_percent = %s WHERE eng_name = %s", (final_dmg, eng_name))
                updated_count += 1
                
                # [검증 로그] 주요 스킬 확인
                if eng_name in ['ABC_CHASING_BREAK', 'ABC_DEFT_STAB', 'MT_RUSH_STRIKE']:
                    print(f"✨ [발견] {name_kr} ({eng_name}) -> {final_dmg}%")

    conn.commit()
    conn.close()
    print(f"\n🎉 총 {updated_count}개 스킬의 배율이 업데이트 되었습니다!")

if __name__ == "__main__":
    run()
