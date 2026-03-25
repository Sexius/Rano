"""상위 스킬 조회"""
import pymysql
conn = pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')
cur = conn.cursor()
cur.execute('SELECT name_kr, damage_percent, hits FROM skills WHERE damage_percent > 1000 ORDER BY damage_percent DESC LIMIT 30')
rows = cur.fetchall()
conn.close()

with open('top_skills.txt', 'w', encoding='utf-8') as f:
    f.write(f"배율 1000%+ 스킬 상위 30개\n\n")
    for r in rows:
        f.write(f"{r[0]}: {r[1]}% x {r[2]}회\n")
print("✅ top_skills.txt 저장됨")
