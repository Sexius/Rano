"""
스킬 데이터 검증 스크립트
현재 DB에 저장된 스킬 데이터를 파일로 출력
"""
import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')
cursor = conn.cursor()

# 주요 스킬 조회
cursor.execute("""
    SELECT eng_name, name_kr, damage_percent, hits 
    FROM skills 
    WHERE eng_name LIKE 'ABC_%' OR eng_name LIKE 'MT_%'
    ORDER BY damage_percent DESC
    LIMIT 50
""")

rows = cursor.fetchall()
conn.close()

with open('skill_check_result.txt', 'w', encoding='utf-8') as f:
    f.write("스킬 데이터 검증 결과\n")
    f.write("=" * 60 + "\n\n")
    
    f.write(f"{'스킬명':<25} {'배율':>10} {'타수':>5}\n")
    f.write("-" * 45 + "\n")
    
    for eng, kr, dmg, hits in rows:
        f.write(f"{kr or eng:<25} {dmg:>8}% {hits if hits else 1:>4}회\n")

print("✅ skill_check_result.txt 저장 완료")
