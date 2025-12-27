import sqlite3

def check_recent_items():
    try:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        cur.execute("SELECT id, name_kr, description FROM items WHERE id BETWEEN 400490 AND 400510 ORDER BY id ASC")
        rows = cur.fetchall()
        
        print(f"Items with ID > 400000 in ro_market.db:")
        for row in rows:
            item_id, name, desc = row
            print(f"ID: {item_id} (type: {type(item_id)}) Name: {name}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_recent_items()
