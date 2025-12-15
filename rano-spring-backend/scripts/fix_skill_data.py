"""
DB 스킬 데이터 정정 스크립트

발견된 문제:
1. 체이싱 브레이크: 5000% x 1회 → 타수 수정 필요
2. 데프트 스탭: 5000% x 7회 → 배율 5400%로 수정 필요 (사용자 확인)

참고:
- 어비스 체이서 주요 스킬들의 정확한 배율/타수는 공식 정보 기반 예상치임
- 실제 게임 데이터와 다를 수 있음
"""
import pymysql

DB_PASSWORD = "1234"

# 정정 데이터
CORRECTIONS = {
    # 스킬ID: (배율%, 타수)
    'ABC_CHASING_BREAK': (5200, 7),  # 체이싱 브레이크: 5200% x 7회 (예상)
    'ABC_DEFT_STAB': (5400, 7),      # 데프트 스탭: 5400% x 7회 (사용자 정보)
}

def run():
    conn = pymysql.connect(
        host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4'
    )
    cursor = conn.cursor()
    
    print("🔧 스킬 데이터 정정 시작...")
    
    # 수정 전 상태
    print("\n📊 수정 전:")
    for skill_id in CORRECTIONS.keys():
        cursor.execute("SELECT eng_name, name_kr, damage_percent, hits FROM skills WHERE eng_name=%s", (skill_id,))
        r = cursor.fetchone()
        if r:
            print(f"   {r[1]}: {r[2]}% x {r[3]}회")
    
    # 수정
    for skill_id, (dmg, hits) in CORRECTIONS.items():
        cursor.execute(
            "UPDATE skills SET damage_percent = %s, hits = %s WHERE eng_name = %s",
            (dmg, hits, skill_id)
        )
        print(f"\n   ✅ {skill_id}: {dmg}% x {hits}회 로 수정")
    
    conn.commit()
    
    # 수정 후 확인
    print("\n📊 수정 후:")
    for skill_id in CORRECTIONS.keys():
        cursor.execute("SELECT eng_name, name_kr, damage_percent, hits FROM skills WHERE eng_name=%s", (skill_id,))
        r = cursor.fetchone()
        if r:
            print(f"   {r[1]}: {r[2]}% x {r[3]}회")
    
    conn.close()
    print("\n🎉 완료! 백엔드 서버를 재시작하세요.")

if __name__ == "__main__":
    run()
