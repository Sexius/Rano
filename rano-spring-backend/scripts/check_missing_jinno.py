import sqlite3
import json

def check_missing_jinno():
    try:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        query = "SELECT id, name_kr, description, raw_data FROM items WHERE name_kr LIKE ? OR name_kr LIKE ?"
        params = ('%인퀴지터%', '%나이트 위치%')
        cur.execute(query, params)
        rows = cur.fetchall()
        
        print(f"Checking specifically for missing '진노' variants:")
        for row in rows:
            item_id, name, desc, raw = row
            status = "✅ HAS DESC" if desc and len(desc) > 10 else "❌ NO DESC"
            print(f"ID: {item_id:<7} Name: {name:<30} Status: {status}")
            
            # If no description, let's see why
            if not desc or len(desc) < 10:
                print(f"  Sample RAW_DATA preview: {raw[:100] if raw else 'NONE'}...")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_missing_jinno()
