import sqlite3

conn = sqlite3.connect('ro_market.db')
cur = conn.cursor()

# List all tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cur.fetchall()
print("Tables in ro_market.db:")
for t in tables:
    print(f"  - {t[0]}")

# Check if items table exists and count
for t in tables:
    table_name = t[0]
    cur.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cur.fetchone()[0]
    print(f"\n{table_name}: {count} rows")
    
    # Show sample data
    cur.execute(f"SELECT * FROM {table_name} LIMIT 3")
    rows = cur.fetchall()
    cur.execute(f"PRAGMA table_info({table_name})")
    columns = [col[1] for col in cur.fetchall()]
    print(f"  Columns: {columns}")
    for row in rows:
        print(f"  Sample: {row[:5]}...")

conn.close()
