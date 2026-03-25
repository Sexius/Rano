import sqlite3
import json

def check_sqlite_jinno_detail():
    try:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        cur.execute("SELECT id, name_kr, description, raw_data FROM items WHERE name_kr LIKE '%진노%'")
        rows = cur.fetchall()
        
        print(f"Details for '진노' items in ro_market.db:")
        for row in rows:
            item_id, name, desc, raw = row
            status = "✅ HAS DESC" if desc and len(desc) > 10 else "❌ NO DESC"
            print(f"ID: {item_id:<7} Name: {name:<30} Status: {status}")
            if not desc or len(desc) < 10:
                if raw:
                    try:
                        raw_json = json.loads(raw)
                        # Check if raw_data has description-like fields
                        # Wait, parse_iteminfo.py saves the item dict as JSON.
                        pass
                    except:
                        pass
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_sqlite_jinno_detail()
