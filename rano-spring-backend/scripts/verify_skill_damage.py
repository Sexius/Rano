import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='1234', db='rano', charset='utf8mb4')
cursor = conn.cursor()

cursor.execute('''
    SELECT eng_name, name_kr, damage_percent 
    FROM skills 
    WHERE eng_name IN ("ABC_CHASING_BREAK", "ABC_DEFT_STAB", "MT_RUSH_STRIKE", "ABC_ABYSS_SQUARE")
    ORDER BY eng_name
''')

results = cursor.fetchall()

print('=' * 70)
print('스킬 데미지 배율 확인:')
print('=' * 70)
for r in results:
    print(f'{r[0]:25s} | {r[1]:20s} | {r[2]:5d}%')
print('=' * 70)

# 전체 통계
cursor.execute('SELECT COUNT(*) FROM skills WHERE damage_percent > 100')
updated_count = cursor.fetchone()[0]
print(f'\n총 {updated_count}개 스킬에 배율 정보가 입력되었습니다.')

conn.close()
