import sqlite3

def get_desc_400494():
    try:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        cur.execute("SELECT description, raw_data FROM items WHERE id = 400494")
        row = cur.fetchone()
        if row:
            desc, raw = row
            print(f"Description for 400494:\n{desc}\n")
            print(f"Raw Data snippet: {raw[:200]}...")
        else:
            print("Not found")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    get_desc_400494()
