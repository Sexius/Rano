"""
특정 스킬 조회 스크립트
"""
import pymysql

DB_PASSWORD = "1234"

def run():
    conn = pymysql.connect(
        host='127.0.0.1', user='root', password=DB_PASSWORD, db='rano', charset='utf8mb4'
    )
    cursor = conn.cursor()
    
    # 데프트 스탭 관련 스킬 확인
    print("🔍 '데프트' 포함 스킬 조회:")
    cursor.execute("""
        SELECT eng_name, name_kr, damage_percent, hits 
        FROM skills 
        WHERE name_kr LIKE '%데프트%' OR eng_name LIKE '%DEFT%'
    """)
    results = cursor.fetchall()
    
    if not results:
        print("  ⚠️ 결과 없음")
    else:
        for r in results:
            print(f"  - {r[0]}: {r[1]}, 배율: {r[2]}%, 타수: {r[3]}")
    
    # 전체 스킬 중 배율 100 이상인 것 개수
    cursor.execute("SELECT COUNT(*) FROM skills WHERE damage_percent > 100")
    cnt_over_100 = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM skills")
    total = cursor.fetchone()[0]
    
    print(f"\n📊 전체 스킬: {total}개, 배율 > 100%인 스킬: {cnt_over_100}개")
    
    conn.close()

if __name__ == "__main__":
    run()
