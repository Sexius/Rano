import pymysql
import re
import os

# ==========================================
# [설정] 파일 경로 및 DB 정보
# ==========================================
# 사용자님이 보내주신 파일 경로로 수정해주세요!
FILE_PATH = "C:/Users/KJM/Desktop/skilldescript.lub"
DB_PASSWORD = "1234"
# ==========================================

def get_db_connection():
    return pymysql.connect(
        host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4'
    )

def extract_skill_damage():
    print(f"📂 파일 읽는 중: {FILE_PATH}")
    
    if not os.path.exists(FILE_PATH):
        print("❌ 파일을 찾을 수 없습니다. 경로를 확인해주세요.")
        return

    # 1. 파일 읽기 (CP949 인코딩으로 깨진 글자 복구)
    try:
        with open(FILE_PATH, 'r', encoding='cp949', errors='ignore') as f:
            content = f.read()
    except Exception as e:
        print(f"❌ 파일 읽기 실패: {e}")
        return

    print(f"✅ 파일 읽기 성공! (크기: {len(content)} bytes)")
    
    # 2. DB 연결 및 컬럼 추가
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        print("🛠️ DB에 'damage_percent' 컬럼 추가 중...")
        cursor.execute("ALTER TABLE skills ADD COLUMN damage_percent INT DEFAULT 100")
        conn.commit()
        print("✅ 'damage_percent' 컬럼 추가 완료")
    except Exception as e:
        print(f"ℹ️ 'damage_percent' 컬럼이 이미 존재합니다. 업데이트를 진행합니다.")

    # 3. 파싱 로직
    # 패턴: [SKID.스킬ID] = { ... "ATK 3800%" ... }
    # 1단계: 스킬 블록 단위로 쪼개기
    skill_blocks = re.split(r'\[SKID\.', content)
    
    print(f"🔍 총 {len(skill_blocks)}개의 스킬 블록 분석 시작...")
    
    count = 0
    success_count = 0
    
    for block in skill_blocks:
        if not block.strip(): continue
        
        # 스킬 ID 추출 (블록 맨 앞에 있음)
        # 예: NV_BASIC] = {
        id_match = re.match(r'([A-Z0-9_]+)\]', block)
        if not id_match: continue
        
        eng_name = id_match.group(1) # 예: NV_BASIC
        
        # 데미지 배율 추출 (가장 높은 % 수치를 찾음)
        # 예: "ATK 3800%" 또는 "데미지 500%" 등
        # 4차 스킬 등은 보통 "ATK 숫자%" 형식을 씀
        
        # 정규식: ATK 뒤에 공백있고 숫자%
        atk_matches = re.findall(r'ATK\s*(\d+)%', block, re.IGNORECASE)
        
        final_dmg = 0
        
        if atk_matches:
            # 여러 개가 나오면(레벨별) 가장 큰 값을 사용 (보통 마스터 레벨)
            final_dmg = max(map(int, atk_matches))
        else:
            # ATK 키워드가 없으면 "데미지 x%" 패턴 등 보조 검색
            # (너무 잡다한 %는 제외하기 위해 100% 이상인 것만)
            dmg_matches = re.findall(r'(\d{3,})%', block)
            if dmg_matches:
                final_dmg = max(map(int, dmg_matches))

        # 4. DB 업데이트 (배율을 찾은 경우만)
        if final_dmg > 0:
            cursor.execute("UPDATE skills SET damage_percent = %s WHERE eng_name = %s", (final_dmg, eng_name))
            success_count += 1
            
            # [검증 로그] 중요 스킬들 확인
            if eng_name in ['ABC_CHASING_BREAK', 'ABC_DEFT_STAB', 'MT_RUSH_STRIKE', 'ABC_ABYSS_SQUARE']:
                print(f"✨ [발견] {eng_name} -> {final_dmg}%")

        count += 1
        if count % 1000 == 0:
            print(f"   ... {count}개 분석 중 ...")

    conn.commit()
    conn.close()
    print("-" * 50)
    print(f"🎉 작업 완료! 총 {success_count}개 스킬의 배율 정보를 DB에 저장했습니다.")
    print("이제 계산기가 '진짜 공식'을 사용할 수 있습니다!")

if __name__ == "__main__":
    extract_skill_damage()
