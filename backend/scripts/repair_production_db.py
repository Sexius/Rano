import psycopg2
import requests
import time
import json

# Render DB Info
PG_HOST = "dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com"
PG_PORT = "5432"
PG_DATABASE = "rano_db"
PG_USER = "rano_db_user"
PG_PASSWORD = "08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4"

# Divine Pride Info
DP_API_KEY = "ca456e340c4915fd8b532ed3" # From previous backend analysis if possible, otherwise I'll need to check ItemService

def get_db_connection():
    return psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DATABASE,
        user=PG_USER,
        password=PG_PASSWORD,
        sslmode='require'
    )

def fetch_from_dp(item_id):
    url = f"https://www.divine-pride.net/api/database/Item/{item_id}?apiKey={DP_API_KEY}"
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        print(f"Error fetching {item_id}: {e}")
    return None

def repair_batch(keywords=None):
    conn = get_db_connection()
    cur = conn.cursor()
    
    if keywords:
        print(f"Phase 1: Repairing by keywords: {keywords}")
        query = "SELECT id, name_kr FROM items WHERE (description IS NULL OR description = '') AND ("
        query += " OR ".join([f"name_kr LIKE '%{kw}%'" for kw in keywords])
        query += ")"
    else:
        print("Phase 2: Global Repair Scan...")
        query = "SELECT id, name_kr FROM items WHERE description IS NULL OR description = '' ORDER BY id ASC"
    
    cur.execute(query)
    rows = cur.fetchall()
    print(f"Found {len(rows)} items to repair.")
    
    repaired = 0
    start_time = time.time()
    
    for i, (item_id, name) in enumerate(rows):
        # 1. Fetch info
        info = fetch_from_dp(item_id)
        if info and info.get('description'):
            desc = info.get('description')
            # 2. Update DB
            cur.execute("UPDATE items SET description = %s, slots = %s WHERE id = %s", 
                        (desc, info.get('slots', 0), item_id))
            repaired += 1
            print(f"[{i+1}/{len(rows)}] ✅ Repaired: {name} ({item_id})")
        else:
            print(f"[{i+1}/{len(rows)}] ❌ Failed: {name} ({item_id})")
        
        # 3. Batch commit
        if (i + 1) % 10 == 0:
            conn.commit()
            print(f"--- Committed @ {i+1} rows ---")
            
        # 4. Respect API limits
        time.sleep(0.3)
        
        # Stop after 20 items for Phase 1 demonstration if needed
        # if repaired >= 50: break

    conn.commit()
    conn.close()
    
    duration = time.time() - start_time
    print(f"\nDone. Repaired {repaired} items in {duration:.2f} seconds.")

if __name__ == "__main__":
    # Test with priority keywords first
    repair_batch(keywords=["선악", "천공", "진노", "설화"])
