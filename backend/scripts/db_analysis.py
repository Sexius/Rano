#!/usr/bin/env python3
"""
V2 DB 분석
"""
import psycopg2
import requests

DB_URL = "postgresql://rano_db_user:08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4@dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com/rano_db"

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

print("=== V2 DB 분석 (baphomet | 천공) ===")

# 1. DB Total
cur.execute("SELECT COUNT(*) FROM vending_listings WHERE server='baphomet' AND item_name LIKE '천공%'")
total = cur.fetchone()[0]
print(f"\nDB Total (천공%): {total}")

# 2. UNIQUE 포함
cur.execute("SELECT COUNT(*) FROM vending_listings WHERE server='baphomet' AND item_name LIKE '%UNIQUE%'")
unique_count = cur.fetchone()[0]
print(f"UNIQUE 포함: {unique_count}")

# 3. +제련 포함
cur.execute("SELECT COUNT(*) FROM vending_listings WHERE server='baphomet' AND item_name LIKE '+%천공%'")
refine_count = cur.fetchone()[0]
print(f"+제련 포함: {refine_count}")

# 4. 샘플 10개
print("\n샘플 10개 (price ASC):")
cur.execute("SELECT item_name, price FROM vending_listings WHERE server='baphomet' AND item_name LIKE '천공%' ORDER BY price ASC LIMIT 10")
for i, row in enumerate(cur.fetchall(), 1):
    print(f"  {i}. {row[0][:50]} - {row[1]:,}z")

# 5. 천공 포함 (LIKE %천공%)
cur.execute("SELECT COUNT(*) FROM vending_listings WHERE server='baphomet' AND item_name LIKE '%천공%'")
total_contains = cur.fetchone()[0]
print(f"\nDB Total (%천공% 포함): {total_contains}")

cur.close()
conn.close()

# 6. V2 API 응답 확인
print("\n=== V2 API 응답 ===")
v2_resp = requests.get("https://rano.onrender.com/api/vending/v2/search?item=%EC%B2%9C%EA%B3%B5&server=baphomet&size=10", timeout=30)
v2 = v2_resp.json()
print(f"total: {v2.get('total')}")
print(f"totalPages: {v2.get('totalPages')}")
print(f"data count: {len(v2.get('data', []))}")
