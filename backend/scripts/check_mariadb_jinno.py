import mysql.connector

def check_mariadb_jinno():
    try:
        conn = mysql.connector.connect(
            host="127.0.0.1",
            user="root",
            password="1234",
            database="rano"
        )
        cur = conn.cursor(dictionary=True)
        
        # Expand range to see what's there
        cur.execute("SELECT id, name_kr, description FROM items WHERE id BETWEEN 400400 AND 400600")
        rows = cur.fetchall()
        
        print(f"Checking items 400400-400600 in local MariaDB:")
        for row in rows:
            desc = row['description']
            status = "✅ HAS DESC" if desc and len(desc) > 10 else "❌ NO DESC"
            print(f"ID: {row['id']:<7} Name: {row['name_kr']:<30} Status: {status}")
            if desc:
                print(f"  Preview: {desc[:50]}...")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_mariadb_jinno()
