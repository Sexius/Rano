import psycopg2

def check_400497():
    try:
        conn = psycopg2.connect(
            host="dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com",
            port="5432",
            database="rano_db",
            user="rano_db_user",
            password="08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4",
            sslmode='require'
        )
        cur = conn.cursor()
        cur.execute("SELECT id, name_kr, description FROM items WHERE id = 400497")
        row = cur.fetchone()
        if row:
            print(f"ID: {row[0]}, Name: {row[1]}")
            print(f"Description Length: {len(row[2]) if row[2] else 0}")
            print(f"Description: {row[2]}")
        else:
            print("Item 400497 not found in PostgreSQL")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_400497()
