import psycopg2

PG_HOST = "dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com"
PG_PORT = "5432"
PG_DATABASE = "rano_db"
PG_USER = "rano_db_user"
PG_PASSWORD = "08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4"

def check_schema():
    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DATABASE,
        user=PG_USER,
        password=PG_PASSWORD,
        sslmode='require'
    )
    cur = conn.cursor()
    
    print("Checking 'items' table schema...")
    cur.execute("""
        SELECT column_name, data_type, character_maximum_length
        FROM information_schema.columns
        WHERE table_name = 'items'
        ORDER BY ordinal_position;
    """)
    rows = cur.fetchall()
    print("Columns:")
    for row in rows:
        print(f"- {row[0]} ({row[1]})")
        
    cur.execute("SELECT COUNT(*) FROM items")
    print(f"\nTotal rows: {cur.fetchone()[0]}")
    
    conn.close()

if __name__ == "__main__":
    check_schema()
