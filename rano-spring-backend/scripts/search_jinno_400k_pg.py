import psycopg2

def search_jinno_400k_pg():
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
        cur.execute("SELECT id, name_kr, description FROM items WHERE name_kr LIKE '%진노%' AND id >= 400000 LIMIT 10")
        rows = cur.fetchall()
        print(f"Items matching '진노' (ID >= 400000) in PostgreSQL:")
        if not rows:
            print("No items found.")
        for row in rows:
            print(f"ID: {row[0]}, Name: {row[1]}, HasDesc: {bool(row[2])}")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    search_jinno_400k_pg()
