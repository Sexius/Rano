"""
DB 스킬 데이터 전체 점검 스크립트

목적: 
1. skills 테이블의 모든 데이터 확인
2. damage_percent와 hits 값의 분포 분석
3. 주요 스킬들의 실제 저장값 확인
"""
import pymysql

DB_PASSWORD = "1234"

def run():
    conn = pymysql.connect(
        host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4'
    )
    cursor = conn.cursor()
    
    print("=" * 70)
    print("📊 스킬 DB 전체 점검")
    print("=" * 70)
    
    # 1. 테이블 전체 통계
    cursor.execute("SELECT COUNT(*) FROM skills")
    total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM skills WHERE damage_percent > 100")
    with_damage = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM skills WHERE hits > 1")
    multi_hit = cursor.fetchone()[0]
    
    print(f"\n📈 전체 통계:")
    print(f"   - 총 스킬 수: {total}")
    print(f"   - 배율 > 100%: {with_damage}")
    print(f"   - 타수 > 1: {multi_hit}")
    
    # 2. 어비스 체이서 관련 스킬 (ABC_)
    print(f"\n🗡️ 어비스 체이서 스킬 (ABC_*):")
    cursor.execute("""
        SELECT eng_name, name_kr, damage_percent, hits 
        FROM skills 
        WHERE eng_name LIKE 'ABC_%'
        ORDER BY damage_percent DESC
    """)
    for r in cursor.fetchall():
        print(f"   {r[0]:30s} | {r[1] or '(no name)':20s} | {r[2]:5d}% × {r[3]}회")
    
    # 3. 마이스터 관련 스킬 (MT_)
    print(f"\n🔨 마이스터 스킬 (MT_*):")
    cursor.execute("""
        SELECT eng_name, name_kr, damage_percent, hits 
        FROM skills 
        WHERE eng_name LIKE 'MT_%'
        ORDER BY damage_percent DESC
    """)
    for r in cursor.fetchall():
        print(f"   {r[0]:30s} | {r[1] or '(no name)':20s} | {r[2]:5d}% × {r[3]}회")
    
    # 4. 혼령사 스킬 (SH_)
    print(f"\n🦊 혼령사 스킬 (SH_*):")
    cursor.execute("""
        SELECT eng_name, name_kr, damage_percent, hits 
        FROM skills 
        WHERE eng_name LIKE 'SH_%'
        ORDER BY damage_percent DESC
        LIMIT 10
    """)
    for r in cursor.fetchall():
        print(f"   {r[0]:30s} | {r[1] or '(no name)':20s} | {r[2]:5d}% × {r[3]}회")
    
    # 5. 비정상적인 hits 값 확인
    print(f"\n⚠️ 비정상적인 hits 값 (> 50):")
    cursor.execute("""
        SELECT eng_name, name_kr, damage_percent, hits 
        FROM skills 
        WHERE hits > 50
        ORDER BY hits DESC
        LIMIT 10
    """)
    abnormal = cursor.fetchall()
    if abnormal:
        for r in abnormal:
            print(f"   {r[0]:30s} | {r[1] or '(no name)':20s} | {r[2]:5d}% × {r[3]}회")
    else:
        print("   (없음)")
    
    # 6. 배율이 정확히 100인 스킬 (파싱 실패 가능성)
    print(f"\n❓ 배율 = 100% (기본값, 파싱 실패 가능성):")
    cursor.execute("""
        SELECT eng_name, name_kr, damage_percent, hits 
        FROM skills 
        WHERE damage_percent = 100
        AND name_kr LIKE '%브레이크%' OR name_kr LIKE '%스탭%' OR name_kr LIKE '%스트라이크%'
        LIMIT 10
    """)
    for r in cursor.fetchall():
        print(f"   {r[0]:30s} | {r[1] or '(no name)':20s} | {r[2]:5d}% × {r[3]}회")
    
    # 7. 체이싱 브레이크, 데프트 스탭 구체적 조회
    print(f"\n🔍 핵심 스킬 상세 조회:")
    target_skills = ['ABC_CHASING_BREAK', 'ABC_DEFT_STAB', 'ABC_ABYSS_SQUARE', 'ABC_FROM_THE_ABYSS']
    for skill_id in target_skills:
        cursor.execute("""
            SELECT eng_name, name_kr, damage_percent, hits, max_level
            FROM skills 
            WHERE eng_name = %s
        """, (skill_id,))
        r = cursor.fetchone()
        if r:
            print(f"   {r[0]}")
            print(f"      한글명: {r[1]}")
            print(f"      배율: {r[2]}%")
            print(f"      타수: {r[3]}회")
            print(f"      최대레벨: {r[4]}")
        else:
            print(f"   {skill_id}: ⚠️ NOT FOUND")
        print()
    
    conn.close()
    print("=" * 70)
    print("✅ 점검 완료")

if __name__ == "__main__":
    run()
