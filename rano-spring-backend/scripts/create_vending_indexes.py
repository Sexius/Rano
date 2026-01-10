#!/usr/bin/env python3
"""
Render PostgreSQL 인덱스 생성 스크립트
"""
import psycopg2

DB_URL = "postgresql://rano_db_user:08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4@dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com/rano_db"

def main():
    print("Connecting to Render PostgreSQL...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()
    
    # 1. pg_trgm 확장 활성화
    print("\n[1] Creating pg_trgm extension...")
    try:
        cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
        print("   Done - pg_trgm extension enabled")
    except Exception as e:
        print(f"   Warning: {e}")
    
    # 2. GIN 인덱스 (부분검색용)
    print("\n[2] Creating GIN trigram index for partial search...")
    try:
        cur.execute("""
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vending_item_trgm
            ON vending_listings USING gin (item_name gin_trgm_ops);
        """)
        print("   Done - idx_vending_item_trgm created")
    except Exception as e:
        print(f"   Warning: {e}")
    
    # 3. B-tree 복합 인덱스 (Prefix + 정렬용)
    print("\n[3] Creating B-tree composite index for prefix search + sort...")
    try:
        cur.execute("""
            CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vending_server_item_scraped
            ON vending_listings (server, item_name varchar_pattern_ops, scraped_at DESC);
        """)
        print("   Done - idx_vending_server_item_scraped created")
    except Exception as e:
        print(f"   Warning: {e}")
    
    # 4. 통계 갱신
    print("\n[4] Running ANALYZE...")
    try:
        cur.execute("ANALYZE vending_listings;")
        print("   Done - ANALYZE completed")
    except Exception as e:
        print(f"   Warning: {e}")
    
    # 5. 인덱스 확인
    print("\n[5] Verifying indexes...")
    cur.execute("""
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'vending_listings';
    """)
    for row in cur.fetchall():
        print(f"   {row[0]}")
    
    cur.close()
    conn.close()
    print("\n[DB] Index creation complete!")

if __name__ == "__main__":
    main()
