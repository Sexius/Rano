import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')
cursor = conn.cursor()

# 주요 스킬 확인
print("\n[주요 스킬 배율 & 타수]")
cursor.execute('''
    SELECT eng_name, name_kr, damage_percent, hits
    FROM skills 
    WHERE eng_name IN ("ABC_CHASING_BREAK", "ABC_DEFT_STAB", "MT_RUSH_STRIKE", "ABC_ABYSS_SQUARE")
    ORDER BY eng_name
''')

for row in cursor.fetchall():
    print(f"  {row[0]:25s} | {row[1]:15s} | {row[2]:6d}% | {row[3]:2d}회")

# 통계
cursor.execute('SELECT COUNT(*) FROM skills WHERE hits > 1')
hits_count = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM skills WHERE damage_percent > 100')
dmg_count = cursor.fetchone()[0]

print(f"\n[통계]")
print(f"  타수 정보 있는 스킬: {hits_count}개")
print(f"  배율 정보 있는 스킬: {dmg_count}개")

conn.close()
