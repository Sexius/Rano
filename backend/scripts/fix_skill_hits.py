"""
스킬 히트 수 수정 스크립트

문제: update_skill_hits.py가 RO 색상 코드(^777777)를 숫자로 오인하여
      일부 스킬의 hits 값이 7777771 같은 비정상적인 값으로 저장됨

해결: 비정상적으로 큰 hits 값(100 이상)을 1로 리셋
"""

import pymysql

DB_PASSWORD = "1234"

def get_db_connection():
    return pymysql.connect(
        host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4'
    )

def run():
    print("🔧 비정상적인 스킬 hits 값 수정 시작...")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. 비정상적인 hits 값을 가진 스킬 확인
    cursor.execute("SELECT eng_name, name_kr, hits FROM skills WHERE hits > 100")
    abnormal_skills = cursor.fetchall()
    
    print(f"⚠️ 비정상적인 hits 값을 가진 스킬: {len(abnormal_skills)}개")
    for eng_name, name_kr, hits in abnormal_skills:
        print(f"   - {name_kr or eng_name}: {hits}회 → 1회로 수정")
    
    # 2. hits > 100인 스킬은 1로 리셋 (대부분 스킬은 1~50회 사이)
    cursor.execute("UPDATE skills SET hits = 1 WHERE hits > 100 OR hits IS NULL")
    fixed_count = cursor.rowcount
    
    conn.commit()
    
    # 3. 결과 확인
    print(f"\n✅ {fixed_count}개 스킬의 hits 값을 수정했습니다.")
    
    # 4. 검증: 주요 스킬 확인
    cursor.execute("""
        SELECT eng_name, name_kr, damage_percent, hits 
        FROM skills 
        WHERE damage_percent > 100 
        ORDER BY damage_percent DESC 
        LIMIT 10
    """)
    
    print("\n📊 상위 10개 스킬 (데미지 순):")
    print("-" * 60)
    for row in cursor.fetchall():
        print(f"  {row[1] or row[0]:20s} | {row[2]:5d}% × {row[3]}회")
    
    conn.close()
    print("\n🎉 완료!")

if __name__ == "__main__":
    run()
