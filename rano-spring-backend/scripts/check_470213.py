import sqlite3

def check_470213():
    try:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        cur.execute("SELECT id, name_kr, description FROM items WHERE id = 470213")
        row = cur.fetchone()
        if row:
            print(f"ID: {row[0]}, Name: {row[1]}")
            print(f"Description: {row[2]}")
        else:
            print("Item 470213 not found in ro_market.db")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_470213()
