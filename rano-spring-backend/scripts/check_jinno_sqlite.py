import sqlite3

def check_sqlite_jinno():
    try:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        cur.execute("SELECT id, name_kr, description FROM items WHERE name_kr LIKE '%진노%'")
        rows = cur.fetchall()
        
        print(f"Found {len(rows)} items containing '진노' in ro_market.db\n")
        for row in rows:
            item_id, name, desc = row
            status = "✅ HAS DESC" if desc and len(desc) > 10 else "❌ NO DESC"
            print(f"ID: {item_id:<7} Name: {name:<30} Status: {status}")
            if not desc or len(desc) < 10:
                pass
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_sqlite_jinno()
