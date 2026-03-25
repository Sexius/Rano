import psycopg2

PG_HOST = "dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com"
PG_PORT = "5432"
PG_DATABASE = "rano_db"
PG_USER = "rano_db_user"
PG_PASSWORD = "08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4"

def optimize_db():
    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DATABASE,
        user=PG_USER,
        password=PG_PASSWORD,
        sslmode='require'
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    try:
        print("Enabling pg_trgm extension...")
        cur.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
        
        print("Creating GIN index on items(name_kr)...")
        # GIN index with gin_trgm_ops is perfect for LIKE '%...%'
        cur.execute("CREATE INDEX IF NOT EXISTS idx_items_name_kr_trgm ON items USING gin (name_kr gin_trgm_ops);")
        
        print("Database optimization complete.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    optimize_db()
