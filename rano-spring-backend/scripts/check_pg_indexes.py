import psycopg2

PG_HOST = "dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com"
PG_PORT = "5432"
PG_DATABASE = "rano_db"
PG_USER = "rano_db_user"
PG_PASSWORD = "08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4"

def check_indexes():
    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DATABASE,
        user=PG_USER,
        password=PG_PASSWORD,
        sslmode='require'
    )
    cur = conn.cursor()
    
    print("Checking indexes for 'items' table...")
    cur.execute("""
        SELECT
            indexname,
            indexdef
        FROM
            pg_indexes
        WHERE
            tablename = 'items';
    """)
    rows = cur.fetchall()
    for row in rows:
        print(f"Index: {row[0]}")
        print(f"Definition: {row[1]}\n")
        
    conn.close()

if __name__ == "__main__":
    check_indexes()
