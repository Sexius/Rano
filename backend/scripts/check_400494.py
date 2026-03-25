import sqlite3
import json

def check_400494():
    try:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        cur.execute("SELECT name_kr, description, raw_data FROM items WHERE id = 400494")
        row = cur.fetchone()
        if row:
            name, desc, raw = row
            print(f"Name: {name}")
            print(f"Description Status: {'✅' if desc else '❌'}")
            print(f"Raw Data: {raw}")
        else:
            print("Item 400494 not found")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_400494()
