import sqlite3

def check_counts():
    try:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        
        cur.execute("SELECT COUNT(*) FROM items")
        total = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM items WHERE description IS NOT NULL AND description != ''")
        has_desc = cur.fetchone()[0]
        
        print(f"Total rows: {total}")
        print(f"Rows with description: {has_desc}")
        
        if has_desc > 0:
            cur.execute("SELECT id, name_kr, description FROM items WHERE description IS NOT NULL AND description != '' LIMIT 3")
            rows = cur.fetchall()
            for row in rows:
                print(f"ID: {row[0]}, Name: {row[1]}, Desc Preview: {row[2][:50]}...")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_counts()
