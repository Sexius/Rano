#!/usr/bin/env python3
"""Clear vending_search_cache to force fresh GNJOY fetches"""
import os
import psycopg2

DB_URL = os.environ.get('DB_URL', 'postgresql://rano_db_user:08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4@dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com/rano_db')

def main():
    conn = psycopg2.connect(DB_URL)
    try:
        cur = conn.cursor()
        
        # Count before
        cur.execute("SELECT COUNT(*) FROM vending_search_cache")
        before = cur.fetchone()[0]
        print(f"[Cache] Before: {before} entries")
        
        # Clear all cache
        cur.execute("DELETE FROM vending_search_cache")
        deleted = cur.rowcount
        conn.commit()
        
        print(f"[Cache] Deleted: {deleted} entries")
        print("[Cache] Cache cleared. Next search will fetch fresh from GNJOY.")
        
    finally:
        conn.close()

if __name__ == "__main__":
    main()
