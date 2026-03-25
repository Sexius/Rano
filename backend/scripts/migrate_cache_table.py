#!/usr/bin/env python3
"""Execute SQL migration for vending_search_cache table"""
import os
import psycopg2

DB_URL = os.environ.get('DB_URL', 'postgresql://rano_db_user:08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4@dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com/rano_db')

SQL = """
CREATE TABLE IF NOT EXISTS vending_search_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(512) NOT NULL UNIQUE,
    server VARCHAR(32) NOT NULL,
    keyword VARCHAR(128) NOT NULL,
    page INTEGER NOT NULL DEFAULT 1,
    size INTEGER NOT NULL DEFAULT 10,
    inclusion INTEGER NOT NULL DEFAULT 1,
    item_order VARCHAR(32) NOT NULL DEFAULT 'price',
    result_json JSONB NOT NULL,
    total_count INTEGER NOT NULL DEFAULT 0,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

CREATE INDEX IF NOT EXISTS idx_vending_cache_expires ON vending_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_vending_cache_server_keyword ON vending_search_cache(server, keyword);
"""

def main():
    conn = psycopg2.connect(DB_URL)
    try:
        cur = conn.cursor()
        cur.execute(SQL)
        conn.commit()
        print("[Migration] vending_search_cache table created successfully")
        
        # Verify
        cur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'vending_search_cache'")
        exists = cur.fetchone()[0] > 0
        print(f"[Migration] Table exists: {exists}")
        
    finally:
        conn.close()

if __name__ == "__main__":
    main()
