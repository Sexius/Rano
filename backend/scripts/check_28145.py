import mysql.connector

def check():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="1234",
        database="rano"
    )
    cur = conn.cursor()
    cur.execute("SELECT name_kr, description FROM items WHERE id = 28145")
    row = cur.fetchone()
    if row:
        name, desc = row
        print(f"ID: 28145, Name: {name}")
        print(f"Description: {'[NULL]' if desc is None else f'[Length: {len(desc)}]'}")
        if desc:
            print(f"Preview: {desc[:50]}")
    else:
        print("Item 28145 not found")
    cur.close()
    conn.close()

if __name__ == "__main__":
    check()
