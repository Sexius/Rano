import mysql.connector

def check_jinno():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="1234",
        database="rano"
    )
    cur = conn.cursor(dictionary=True)
    
    # Search for items containing '진노'
    cur.execute("SELECT id, name_kr, description FROM items WHERE name_kr LIKE '%진노%'")
    rows = cur.fetchall()
    
    print(f"Found {len(rows)} items containing '진노'\n")
    for row in rows:
        desc = row['description']
        status = "✅ HAS DESC" if desc and len(desc) > 10 else "❌ NO DESC"
        print(f"ID: {row['id']:<7} Name: {row['name_kr']:<30} Status: {status}")
        if not desc or len(desc) < 10:
             # Check raw_data or parsed_data if they exist
             pass

    cur.close()
    conn.close()

if __name__ == "__main__":
    check_jinno()
