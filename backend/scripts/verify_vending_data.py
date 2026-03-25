#!/usr/bin/env python3
"""
Vending DB 검증 쿼리
"""
import psycopg2

DB_URL = "postgresql://rano_db_user:08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4@dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com/rano_db"

def main():
    print("Connecting to Render PostgreSQL...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    print("\n=== Vending Listings 검증 ===\n")
    
    # 1. 전체 수
    cur.execute("SELECT COUNT(*) FROM vending_listings;")
    total = cur.fetchone()[0]
    print(f"Total rows: {total}")
    
    # 2. UNIQUE 포함 수
    cur.execute("SELECT COUNT(*) FROM vending_listings WHERE item_name LIKE '%UNIQUE%';")
    unique_count = cur.fetchone()[0]
    print(f"UNIQUE items: {unique_count}")
    
    # 3. 제련(+숫자) 포함 수
    cur.execute("SELECT COUNT(*) FROM vending_listings WHERE item_name LIKE '%+%';")
    refine_count = cur.fetchone()[0]
    print(f"Refined items (+): {refine_count}")
    
    # 4. 천공 관련 (baphomet)
    cur.execute("SELECT COUNT(*) FROM vending_listings WHERE server='baphomet' AND item_name LIKE '%천공%';")
    chunggong = cur.fetchone()[0]
    print(f"천공 items (baphomet): {chunggong}")
    
    # 5. 샘플 데이터 (5개)
    print("\n=== Sample Data (5 rows) ===")
    cur.execute("SELECT server, item_name, price FROM vending_listings LIMIT 5;")
    for row in cur.fetchall():
        print(f"  {row[0]} | {row[1]} | {row[2]:,}z")
    
    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
