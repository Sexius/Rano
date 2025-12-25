"""
Fix table name: item -> items
"""
import psycopg2

PG_HOST = "dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com"
PG_PORT = "5432"
PG_DATABASE = "rano_db"
PG_USER = "rano_db_user"
PG_PASSWORD = "08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4"

def fix_table_name():
    print("Connecting to PostgreSQL...")
    conn = psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DATABASE,
        user=PG_USER,
        password=PG_PASSWORD,
        sslmode='require'
    )
    cur = conn.cursor()
    
    # Check if 'item' table exists
    cur.execute("SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'item')")
    item_exists = cur.fetchone()[0]
    
    cur.execute("SELECT EXISTS(SELECT FROM information_schema.tables WHERE table_name = 'items')")
    items_exists = cur.fetchone()[0]
    
    print(f"'item' table exists: {item_exists}")
    print(f"'items' table exists: {items_exists}")
    
    if item_exists and not items_exists:
        print("Renaming 'item' to 'items'...")
        cur.execute("ALTER TABLE item RENAME TO items")
        conn.commit()
        print("✅ Table renamed successfully!")
    elif item_exists and items_exists:
        print("Both tables exist. Dropping 'items' and renaming 'item'...")
        cur.execute("DROP TABLE items")
        cur.execute("ALTER TABLE item RENAME TO items")
        conn.commit()
        print("✅ Done!")
    elif items_exists:
        print("'items' table already exists!")
    else:
        print("No tables found. Something is wrong.")
    
    # Verify
    cur.execute("SELECT COUNT(*) FROM items")
    count = cur.fetchone()[0]
    print(f"'items' table now has: {count} rows")
    
    conn.close()

if __name__ == "__main__":
    fix_table_name()
