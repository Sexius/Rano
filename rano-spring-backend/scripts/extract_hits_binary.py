import pymysql
import re

# ==========================================
# [설정] 파일 경로
# ==========================================
FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"
DB_PASSWORD = "1234"
# ==========================================

def get_db_connection():
    return pymysql.connect(
        host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4'
    )

def run():
    print("🚀 바이너리 모드로 타수(Hits) 정밀 채굴 시작...")
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. hits 컬럼 확인 및 추가
    try:
        cursor.execute("ALTER TABLE skills ADD COLUMN hits INT DEFAULT 1")
        conn.commit()
    except:
        pass # 이미 존재하면 패스

    # 2. 파일 통째로 읽기 (바이너리 모드 rb)
    try:
        with open(FILE_PATH, 'rb') as f:
            content = f.read()
    except FileNotFoundError:
        print("❌ 파일을 찾을 수 없습니다.")
        return

    print(f"✅ 파일 로드 완료 ({len(content)} bytes)")

    # 3. 검색할 키워드를 미리 바이트로 변환 (CP949 인코딩)
    # 정규식: (숫자) + (공백가능) + (회|연타|Hit)
    # 바이너리 정규식 조립
    
    # "회" (CP949)
    byte_hoe = '회'.encode('cp949')
    # "연타" (CP949)
    byte_yeonta = '연타'.encode('cp949')
    # "Hit" (ASCII)
    byte_hit = b'Hit'
    
    # 패턴: 숫자(\d+) + 공백(\s*) + (회|연타|Hit)
    # rb'...' 패턴 사용
    pattern = re.compile(rb'(\d+)\s*(' + re.escape(byte_hoe) + rb'|' + re.escape(byte_yeonta) + rb'|' + byte_hit + rb')', re.IGNORECASE)

    # 4. 스킬 목록 가져오기
    cursor.execute("SELECT eng_name, name_kr FROM skills")
    skills = cursor.fetchall()
    
    update_count = 0
    
    for eng_name, name_kr in skills:
        if not name_kr: continue

        # (1) 스킬 이름을 바이트로 변환
        try:
            name_bytes = name_kr.encode('cp949')
        except:
            continue

        # (2) 파일 내 위치 찾기
        start_idx = content.find(name_bytes)
        if start_idx == -1:
            continue

        # (3) 검색 범위 설정 (이름 발견 위치부터 1000바이트 뒤까지)
        # 스킬 설명이 길 수도 있으므로 넉넉하게 잡음
        search_area = content[start_idx : start_idx + 1200]
        
        # (4) 타수 패턴 검색
        matches = pattern.findall(search_area)
        
        if matches:
            # matches는 [(숫자, 단위), (숫자, 단위)...] 형태
            # 숫자만 추출해서 정수로 변환
            hits_found = []
            for m in matches:
                try:
                    val = int(m[0])
                    # 너무 큰 숫자는 제외 (예: 2000회... 이런건 배율일 가능성 있음)
                    # 보통 타수는 1~30 사이
                    if 1 < val <= 50: 
                        hits_found.append(val)
                except:
                    pass
            
            if hits_found:
                # 가장 큰 값을 타수로 인정 (보통 마스터 레벨 타수가 가장 크므로)
                max_hits = max(hits_found)
                
                # DB 업데이트
                if max_hits > 1:
                    cursor.execute("UPDATE skills SET hits = %s WHERE eng_name = %s", (max_hits, eng_name))
                    update_count += 1
                    
                    # [검증 로그]
                    if eng_name in ['ABC_CHASING_BREAK', 'ABC_DEFT_STAB', 'MT_RUSH_STRIKE', 'ABC_ABYSS_SQUARE']:
                        print(f"✨ [타수 발견] {name_kr}: {max_hits}회")

    conn.commit()
    conn.close()
    print(f"\n🎉 작업 완료! 총 {update_count}개 스킬의 타수 정보가 자동 업데이트되었습니다.")

if __name__ == "__main__":
    run()
