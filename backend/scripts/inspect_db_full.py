import sqlite3

def inspect_db():
    try:
        conn = sqlite3.connect('ro_market.db')
        cur = conn.cursor()
        
        # List tables
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cur.fetchall()
        print(f"Tables: {tables}")
        
        for table in tables:
            table_name = table[0]
            print(f"\n--- Schema for table: {table_name} ---")
            cur.execute(f"PRAGMA table_info({table_name})")
            columns = cur.fetchall()
            for col in columns:
                print(col)
            
            # Count rows
            cur.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cur.fetchone()[0]
            print(f"Row count: {count}")
            
            # Show top 1 sample with descriptions
            cur.execute(f"SELECT * FROM {table_name} WHERE description IS NOT NULL AND length(description) > 50 LIMIT 1")
            sample = cur.fetchone()
            if sample:
                print(f"Sample with description found!")
            else:
                print("No rows with long description found in this table.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    inspect_db()
