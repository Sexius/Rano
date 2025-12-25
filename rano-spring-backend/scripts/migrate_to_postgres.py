"""
SQLite -> PostgreSQL Migration Script for Item Data
Render PostgreSQL로 아이템 데이터 마이그레이션
"""
import sqlite3
import psycopg2
import os

# ------------------------------------------
# 설정 (Render External Database URL에서 가져온 정보)
# ------------------------------------------
PG_HOST = "dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com"
PG_PORT = "5432"
PG_DATABASE = "rano_db"
PG_USER = "rano_db_user"
PG_PASSWORD = "08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4"

SQLITE_PATH = "ro_market.db"

def migrate():
    print("=" * 50)
    print("SQLite -> PostgreSQL Migration")
    print("=" * 50)
    
    # Connect to SQLite
    print("\n1. Connecting to SQLite...")
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_cur = sqlite_conn.cursor()
    
    # Connect to PostgreSQL
    print("2. Connecting to PostgreSQL...")
    pg_conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DATABASE,
        user=PG_USER,
        password=PG_PASSWORD,
        sslmode='require'
    )
    pg_cur = pg_conn.cursor()
    
    # Check SQLite table structure
    sqlite_cur.execute("PRAGMA table_info(items)")
    columns = sqlite_cur.fetchall()
    print(f"\n3. SQLite columns: {[c[1] for c in columns]}")
    
    # Create PostgreSQL table (matching Spring Boot Item entity)
    print("\n4. Creating PostgreSQL table (if not exists)...")
    pg_cur.execute("""
        CREATE TABLE IF NOT EXISTS item (
            id INTEGER PRIMARY KEY,
            name_kr VARCHAR(255),
            description TEXT,
            slots INTEGER DEFAULT 0,
            raw_data TEXT,
            parsed_data TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    pg_conn.commit()
    
    # Check existing data
    pg_cur.execute("SELECT COUNT(*) FROM item")
    existing_count = pg_cur.fetchone()[0]
    print(f"   Existing PostgreSQL data: {existing_count} rows")
    
    if existing_count > 0:
        response = input("   Data exists. Clear and re-import? (y/n): ")
        if response.lower() == 'y':
            pg_cur.execute("DELETE FROM item")
            pg_conn.commit()
            print("   Cleared existing data.")
        else:
            print("   Skipping migration.")
            return
    
    # Get SQLite data
    print("\n5. Reading SQLite data...")
    sqlite_cur.execute("SELECT * FROM items")
    rows = sqlite_cur.fetchall()
    print(f"   Found {len(rows)} items")
    
    # Migrate data
    print("\n6. Migrating to PostgreSQL...")
    batch_size = 500
    migrated = 0
    
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        for row in batch:
            try:
                # SQLite structure: id, server, item_name, quantity, price, vendor_info
                # OR: id, name_kr, description, slots, raw_data, parsed_data
                
                # Check if it's vending data or item data
                if len(row) >= 6 and isinstance(row[1], str):
                    # Assume item data format
                    item_id = row[0]
                    name_kr = row[1] if len(row) > 1 else None
                    description = row[2] if len(row) > 2 else None
                    slots = row[3] if len(row) > 3 else 0
                    raw_data = row[4] if len(row) > 4 else None
                    parsed_data = row[5] if len(row) > 5 else None
                    
                    pg_cur.execute("""
                        INSERT INTO item (id, name_kr, description, slots, raw_data, parsed_data)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        ON CONFLICT (id) DO UPDATE SET
                            name_kr = EXCLUDED.name_kr,
                            description = EXCLUDED.description,
                            slots = EXCLUDED.slots,
                            raw_data = EXCLUDED.raw_data,
                            parsed_data = EXCLUDED.parsed_data
                    """, (item_id, name_kr, description, slots, raw_data, parsed_data))
                    migrated += 1
                    
            except Exception as e:
                print(f"   Error on row {row[0]}: {e}")
                continue
        
        pg_conn.commit()
        print(f"   Progress: {min(i + batch_size, len(rows))}/{len(rows)} rows")
    
    print(f"\n7. Migration complete! {migrated} items migrated.")
    
    # Verify
    pg_cur.execute("SELECT COUNT(*) FROM item")
    final_count = pg_cur.fetchone()[0]
    print(f"   PostgreSQL now has: {final_count} items")
    
    # Show sample
    pg_cur.execute("SELECT id, name_kr FROM item LIMIT 5")
    print("\n   Sample data:")
    for row in pg_cur.fetchall():
        print(f"     {row[0]}: {row[1]}")
    
    # Cleanup
    sqlite_conn.close()
    pg_conn.close()
    print("\n✅ Done!")

if __name__ == "__main__":
    migrate()
