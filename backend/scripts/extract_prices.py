"""
rAthena item_db.yml price extractor
Downloads item_db files from rAthena GitHub and extracts Buy/Sell prices
"""
import requests
import re
import psycopg2
from psycopg2.extras import execute_batch
import sys

# rAthena GitHub raw URLs
RATHENA_BASE = "https://raw.githubusercontent.com/rathena/rathena/master/db/re/"
ITEM_DB_FILES = [
    "item_db_equip.yml",
    "item_db_usable.yml", 
    "item_db_etc.yml"
]

# Production DB Info
PG_HOST = "dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com"
PG_PORT = "5432"
PG_DATABASE = "rano_db"
PG_USER = "rano_db_user"
PG_PASSWORD = "08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4"

def get_pg_connection():
    return psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DATABASE,
        user=PG_USER,
        password=PG_PASSWORD,
        sslmode='require'
    )

def download_item_db(filename):
    """Download item_db file from rAthena GitHub"""
    url = RATHENA_BASE + filename
    print(f"Downloading {filename}...")
    resp = requests.get(url, timeout=60)
    if resp.status_code == 200:
        return resp.text
    else:
        print(f"Failed to download {filename}: {resp.status_code}")
        return None

def parse_item_prices(content):
    """Parse YAML content and extract item IDs with Buy/Sell prices"""
    items = {}
    
    # YAML structure:
    # - Id: 501
    #   ...
    #   Buy: 50
    #   Sell: 10
    #   ...
    
    current_id = None
    current_buy = None
    current_sell = None
    
    for line in content.split('\n'):
        line = line.strip()
        
        # New item block
        if line.startswith('- Id:'):
            # Save previous item if exists
            if current_id is not None:
                if current_buy or current_sell:
                    # If only one is set, calculate the other
                    if current_buy and not current_sell:
                        current_sell = current_buy // 2
                    elif current_sell and not current_buy:
                        current_buy = current_sell * 2
                    items[current_id] = {
                        'buy': current_buy or 0,
                        'sell': current_sell or 0
                    }
            
            # Extract new ID
            match = re.search(r'Id:\s*(\d+)', line)
            if match:
                current_id = int(match.group(1))
                current_buy = None
                current_sell = None
        
        # Buy price
        elif line.startswith('Buy:'):
            match = re.search(r'Buy:\s*(\d+)', line)
            if match:
                current_buy = int(match.group(1))
        
        # Sell price
        elif line.startswith('Sell:'):
            match = re.search(r'Sell:\s*(\d+)', line)
            if match:
                current_sell = int(match.group(1))
    
    # Don't forget last item
    if current_id is not None and (current_buy or current_sell):
        if current_buy and not current_sell:
            current_sell = current_buy // 2
        elif current_sell and not current_buy:
            current_buy = current_sell * 2
        items[current_id] = {
            'buy': current_buy or 0,
            'sell': current_sell or 0
        }
    
    return items

def add_price_columns():
    """Add buy_price and sell_price columns to items table if not exist"""
    print("Adding price columns to database...")
    conn = get_pg_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            ALTER TABLE items 
            ADD COLUMN IF NOT EXISTS buy_price INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS sell_price INTEGER DEFAULT 0
        """)
        conn.commit()
        print("Columns added successfully.")
    except Exception as e:
        print(f"Error adding columns: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

def migrate_prices(items_data):
    """Update items table with price data"""
    if not items_data:
        print("No data to migrate.")
        return
    
    print(f"Migrating {len(items_data)} item prices to database...")
    conn = get_pg_connection()
    cur = conn.cursor()
    
    query = """
        UPDATE items 
        SET buy_price = %s, sell_price = %s
        WHERE id = %s
    """
    
    batch_size = 500
    items_list = list(items_data.items())
    count = 0
    updated = 0
    
    for i in range(0, len(items_list), batch_size):
        batch = items_list[i : i + batch_size]
        params = [(d['buy'], d['sell'], item_id) for item_id, d in batch]
        
        for p in params:
            cur.execute(query, p)
            updated += cur.rowcount
        
        conn.commit()
        count += len(batch)
        print(f"  Processed {count}/{len(items_data)} items, updated {updated} rows...")
    
    cur.close()
    conn.close()
    print(f"Migration complete. Total updated: {updated}")

def test_mode(items_data):
    """Test extraction with sample items"""
    test_ids = [1101, 501, 502, 1201, 2301]  # Sword, Red Potion, Orange Potion, Knife, Cotton Shirt
    print("\n=== Test Mode ===")
    for test_id in test_ids:
        if test_id in items_data:
            data = items_data[test_id]
            print(f"ID {test_id}: Buy={data['buy']}z, Sell={data['sell']}z")
            print(f"  Discount Buy (Lv10): {int(data['buy'] * 0.76)}z")
            print(f"  Overcharge Sell (Lv10): {int(data['sell'] * 1.24)}z")
        else:
            print(f"ID {test_id}: NOT FOUND")

if __name__ == "__main__":
    force = '--force' in sys.argv
    test = '--test' in sys.argv
    
    # Download and parse all item_db files
    all_items = {}
    for filename in ITEM_DB_FILES:
        content = download_item_db(filename)
        if content:
            items = parse_item_prices(content)
            print(f"  Parsed {len(items)} items from {filename}")
            all_items.update(items)
    
    print(f"\nTotal items with price data: {len(all_items)}")
    
    if test:
        test_mode(all_items)
    elif force:
        add_price_columns()
        migrate_prices(all_items)
    else:
        print("\nRun with --test to verify extraction")
        print("Run with --force to migrate to production")
        test_mode(all_items)
