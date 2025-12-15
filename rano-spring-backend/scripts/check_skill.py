import pymysql
import json

conn = pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')
cursor = conn.cursor()

# 1. 주요 스킬 확인
print("\n[주요 스킬 데미지 배율]")
cursor.execute('''
    SELECT eng_name, name_kr, damage_percent 
    FROM skills 
    WHERE eng_name IN ("ABC_CHASING_BREAK", "ABC_DEFT_STAB", "MT_RUSH_STRIKE", "ABC_ABYSS_SQUARE", "ABC_FROM_THE_ABYSS")
    ORDER BY eng_name
''')

for row in cursor.fetchall():
    print(f"  {row[0]}: {row[1]} -> {row[2]}%")

# 2. 전체 통계
cursor.execute('SELECT COUNT(*) FROM skills WHERE damage_percent > 100')
updated_count = cursor.fetchone()[0]

cursor.execute('SELECT COUNT(*) FROM skills')
total_count = cursor.fetchone()[0]

print(f"\n[통계]")
print(f"  전체 스킬: {total_count}개")
print(f"  배율 입력됨: {updated_count}개")
print(f"  비율: {updated_count/total_count*100:.1f}%")

conn.close()
