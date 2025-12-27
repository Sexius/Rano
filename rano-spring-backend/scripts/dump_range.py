import sqlite3

def dump_range():
    try:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        cur.execute("SELECT id, name_kr, description FROM items WHERE id BETWEEN 400490 AND 400510")
        rows = cur.fetchall()
        
        with open('range_dump.txt', 'w', encoding='utf-8') as f:
            for row in rows:
                item_id, name, desc = row
                has_desc = "YES" if desc else "NO"
                f.write(f"ID: {item_id}, Name: {name}, HasDesc: {has_desc}\n")
        
        print(f"Dumped {len(rows)} items to range_dump.txt")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    dump_range()
