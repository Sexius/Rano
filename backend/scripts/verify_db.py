# -*- coding: utf-8 -*-
import sqlite3

conn = sqlite3.connect(r'e:\RAG\rano-spring-backend\ro_market.db')
cursor = conn.cursor()

# 총 아이템 수
cursor.execute('SELECT COUNT(*) FROM items')
total = cursor.fetchone()[0]
print(f'총 아이템 수: {total:,}')

# 천공 검색
print('\n=== 천공 검색 결과 ===')
cursor.execute('SELECT id, name_kr FROM items WHERE name_kr LIKE ? ORDER BY id', ('%천공%',))
results = cursor.fetchall()
print(f'검색 결과: {len(results)}개')
for row in results:
    print(f'  [{row[0]}] {row[1]}')

conn.close()
