import psycopg2
import os
import json

def check_descriptions():
    db_url = os.environ.get('DATABASE_URL')
    
    try:
        if db_url:
            print("Connecting to PostgreSQL via DATABASE_URL...")
            conn = psycopg2.connect(db_url)
        else:
            print("Connecting to local MariaDB...")
            import mysql.connector
            conn = mysql.connector.connect(
                host="localhost",
                user="root",
                password="1234",
                database="rano"
            )
        cur = conn.cursor()
        
        # Check total items and items with descriptions
        cur.execute("SELECT COUNT(*) FROM items")
        total = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM items WHERE description IS NOT NULL AND description != ''")
        with_desc = cur.fetchone()[0]
        
        print(f"Total Items: {total}")
        print(f"Items with descriptions: {with_desc}")
        
        # Show sample data
        if with_desc > 0:
            cur.execute("SELECT id, name_kr, description FROM items WHERE description IS NOT NULL AND description != '' LIMIT 5")
            samples = cur.fetchall()
            print("\nSample Data:")
            for s in samples:
                desc_preview = s[2][:100] + "..." if s[2] else "None"
                print(f"ID: {s[0]}, Name: {s[1]}, Desc Preview: {desc_preview}")
        else:
            print("\nNo descriptions found in any records!")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_descriptions()
