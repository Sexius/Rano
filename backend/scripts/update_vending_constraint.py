#!/usr/bin/env python3
"""
Render DB 제약 변경 및 검증 스크립트
"""
import psycopg2

DB_URL = "postgresql://rano_db_user:08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4@dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com/rano_db"

def main():
    print("Connecting to Render PostgreSQL...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()
    
    # 1. 기존 제약 삭제
    print("\n[1] Dropping old UNIQUE constraint...")
    try:
        cur.execute("ALTER TABLE vending_listings DROP CONSTRAINT IF EXISTS uq_vending_listing;")
        print("   Done - old constraint dropped")
    except Exception as e:
        print(f"   Warning: {e}")
    
    # 2. 새 제약 추가 (price 포함)
    print("\n[2] Adding new UNIQUE constraint (with price)...")
    try:
        cur.execute("""
            ALTER TABLE vending_listings ADD CONSTRAINT uq_vending_listing 
            UNIQUE (server, map_id, ssi, item_name, price);
        """)
        print("   Done - new constraint added")
    except Exception as e:
        print(f"   Warning: {e}")
    
    # 3. 기존 데이터 삭제
    print("\n[3] Deleting existing data...")
    try:
        cur.execute("DELETE FROM vending_listings;")
        print(f"   Done - deleted all rows")
    except Exception as e:
        print(f"   Error: {e}")
    
    cur.close()
    conn.close()
    print("\n[DB] Schema update complete. Ready for re-collection.")

if __name__ == "__main__":
    main()
