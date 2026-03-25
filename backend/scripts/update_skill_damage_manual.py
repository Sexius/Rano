"""
스킬 데미지 배율 수동 업데이트 스크립트

누락된 주요 스킬들의 배율을 수동으로 설정합니다.
"""
import pymysql

DB_PASSWORD = "1234"

# 주요 스킬 배율 정보 (스킬 ID: (배율%, 타수))
# 참고: 라그나로크 온라인 한국 공식 서버 기준
SKILL_DATA = {
    # 어비스 체이서 스킬
    'ABC_DEFT_STAB': (5000, 7),          # 데프트 스탭: 500% × 10타 = 5000%
    'ABC_CHASING_BREAK': (5000, 1),      # 체이싱 브레이크: 5000% × 1타
    'ABC_ABYSS_SQUARE': (980, 7),        # 어비스 스퀘어: 140% × 7타 = 980%
    'ABC_FROM_THE_ABYSS': (7350, 1),     # 프롬 디 어비스: 7350%
    'ABC_ABYSS_DAGGER': (7350, 1),       # 어비스 대거
    'ABC_OMEGA_ABYSS_STRIKE': (26500, 1), # 오메가 어비스 스트라이크
    
    # 마이스터 스킬
    'MT_RUSH_STRIKE': (3800, 1),         # 러쉬 스트라이크: 3800%
    'MT_POWERFUL_SMASH': (2800, 1),      # 파워풀 스매쉬
    'MT_TRIPLE_BOWLING': (4200, 3),      # 트리플 볼링 배쉬
    
    # 혼령사 스킬
    'SH_CHUL_HO_BATTERING': (2100, 5),   # 철호 난무
    'SH_HAWK_HUNT': (2500, 1),           # 호크 헌팅
    
    # 체인 스킬
    'ABC_CHAIN_REACTION_SHOT': (4250, 1), # 체인 리액션 샷
}

def run():
    print("🔧 주요 스킬 데미지 배율 수동 업데이트...")
    conn = pymysql.connect(
        host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4'
    )
    cursor = conn.cursor()
    
    count = 0
    for eng_name, (dmg_pct, hits) in SKILL_DATA.items():
        cursor.execute(
            "UPDATE skills SET damage_percent = %s, hits = %s WHERE eng_name = %s",
            (dmg_pct, hits, eng_name)
        )
        if cursor.rowcount > 0:
            count += 1
            print(f"  ✅ {eng_name}: {dmg_pct}% × {hits}회")
        else:
            print(f"  ⚠️ {eng_name}: 스킬 없음")
    
    conn.commit()
    
    # 확인
    print("\n📊 업데이트 결과:")
    cursor.execute("""
        SELECT eng_name, name_kr, damage_percent, hits 
        FROM skills 
        WHERE eng_name IN ('ABC_DEFT_STAB', 'ABC_CHASING_BREAK', 'MT_RUSH_STRIKE')
    """)
    for r in cursor.fetchall():
        print(f"  - {r[1]}: {r[2]}% × {r[3]}회")
    
    conn.close()
    print(f"\n🎉 총 {count}개 스킬 업데이트 완료!")

if __name__ == "__main__":
    run()
