import psycopg2
import os

# Render DB Info
PG_HOST = "dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com"
PG_PORT = "5432"
PG_DATABASE = "rano_db"
PG_USER = "rano_db_user"
# I'll use the password from migrate_to_postgres.py
PG_PASSWORD = "08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4"

def scan_all_missing():
    try:
        conn = psycopg2.connect(
            host=PG_HOST,
            port=PG_PORT,
            database=PG_DATABASE,
            user=PG_USER,
            password=PG_PASSWORD,
            sslmode='require'
        )
        cur = conn.cursor()
        
        cur.execute("SELECT id, name_kr, description FROM items WHERE id BETWEEN 470200 AND 470300 ORDER BY id ASC")
        rows = cur.fetchall()
        
        print(f"Items with ID 470200-470300 in PostgreSQL:")
        for row in rows:
            item_id, name, desc = row
            status = "✅ DESC" if desc and len(desc) > 10 else "❌ NO_DESC"
            print(f"ID: {item_id:<7} Name: {name:<30} Status: {status}")
            if desc and len(desc) > 10:
                print(f"   Preview: {desc[:50]}...")

        min_id, max_id = cur.fetchone()
        print(f"Missing items range: ID {min_id} ~ {max_id}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    scan_all_missing()
