import psycopg2
import os

# Render DB Info
PG_HOST = "dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com"
PG_PORT = "5432"
PG_DATABASE = "rano_db"
PG_USER = "rano_db_user"
PG_PASSWORD = "08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4"

def scan_priority():
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
        
        # Check specific items like 선악의 부츠 (470213)
        cur.execute("SELECT id, name_kr, description FROM items WHERE id BETWEEN 470200 AND 470300 ORDER BY id ASC")
        rows = cur.fetchall()
        
        print(f"Items with ID 470200-470300 in PostgreSQL:")
        if not rows:
            print("No items found in this range.")
        for row in rows:
            item_id, name, desc = row
            status = "✅ HAS DESC" if desc and len(desc) > 10 else "❌ NO DESC"
            print(f"ID: {item_id:<7} Name: {name:<30} Status: {status}")
            if desc and len(desc) > 10:
                 print(f"   Preview: {desc[:50]}...")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    scan_priority()
