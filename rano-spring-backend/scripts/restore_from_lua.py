import psycopg2
import re
import os
import sys

# Production DB Info
PG_HOST = "dpg-d502jpmmcj7s73e1q5tg-a.singapore-postgres.render.com"
PG_PORT = "5432"
PG_DATABASE = "rano_db"
PG_USER = "rano_db_user"
PG_PASSWORD = "08IqeFbUFQNLN7t5hw9lHbPgdThhxVs4"

# Local Source Info
LUA_PATH = r"e:\RAG\rano-spring-backend\scripts\extracted\iteminfo.lua"

def get_pg_connection():
    return psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DATABASE,
        user=PG_USER,
        password=PG_PASSWORD,
        sslmode='require'
    )

def decode_lua_bytes(b_str):
    """Interpret Lua escape sequences in bytes and decode as euc-kr"""
    if not b_str: return ""
    
    result = bytearray()
    i = 0
    while i < len(b_str):
        # Check for \NNN
        if b_str[i:i+1] == b'\\' and i + 1 < len(b_str) and b_str[i+1:i+2].isdigit():
            num_str = b''
            j = i + 1
            while j < len(b_str) and b_str[j:j+1].isdigit() and len(num_str) < 3:
                num_str += b_str[j:j+1]
                j += 1
            if num_str:
                result.append(int(num_str))
                i = j
                continue
        result.append(b_str[i])
        i += 1
    
    try:
        return result.decode('euc-kr')
    except:
        return result.decode('utf-8', errors='replace')

def parse_lua_binary(file_path):
    print(f"Reading Lua file (Binary): {file_path}")
    if not os.path.exists(file_path):
        print("Error: File not found.")
        return {}

    with open(file_path, 'rb') as f:
        content = f.read()

    print(f"File size: {len(content):,} bytes")
    
    # Binary regex for [ID] = {
    item_pattern = re.compile(rb'\[(\d+)\]\s*=\s*\{')
    matches = list(item_pattern.finditer(content))
    print(f"Found {len(matches)} potential item blocks.")
    
    items_data = {}
    
    for i in range(len(matches)):
        start_match = matches[i]
        item_id = int(start_match.group(1))
        
        start_pos = start_match.end()
        end_pos = matches[i+1].start() if i + 1 < len(matches) else len(content)
        
        block = content[start_pos:end_pos]
        
        # Extract identifiedDisplayName
        # identifiedDisplayName = "..."
        name_match = re.search(rb'identifiedDisplayName\s*=\s*"([^"]*)"', block)
        name_kr = decode_lua_bytes(name_match.group(1)) if name_match else ""
        
        # Extract identifiedDescriptionName = { ... }
        # Anchor the search to avoid matching "unidentifiedDescriptionName"
        desc_match = re.search(rb'\s+identifiedDescriptionName\s*=\s*\{', block)
        description = ""
        if desc_match:
            desc_start = desc_match.end()
            # Find the matching closing brace (simple version for now)
            # but we need to find the FIRST closing brace at the same level? 
            # iteminfo.lua descs don't have nested tables.
            desc_end = block.find(b'}', desc_start)
            if desc_end != -1:
                desc_content = block[desc_start:desc_end]
                # Find all "..."
                lines = re.findall(rb'"([^"]*)"', desc_content)
                decoded_lines = [decode_lua_bytes(l) for l in lines]
                description = "\\n".join(decoded_lines)
        
        # Extract slotCount
        slot_match = re.search(rb'slotCount\s*=\s*(\d+)', block)
        slots = int(slot_match.group(1)) if slot_match else 0
        
        if name_kr or description:
            items_data[item_id] = {
                'name_kr': name_kr,
                'description': description,
                'slots': slots
            }
            
        if (i+1) % 5000 == 0:
            print(f"  Processed {i+1} items...")

    return items_data

from psycopg2.extras import execute_batch

def migrate_to_pg(items_data):
    if not items_data:
        print("No data to migrate.")
        return

    print(f"Connecting to Production PostgreSQL...")
    conn = get_pg_connection()
    cur = conn.cursor()
    
    print(f"Starting optimized migration of {len(items_data)} items...")
    
    count = 0
    batch_size = 500  # Larger batches for execute_batch
    
    items_list = list(items_data.items())
    
    query = """
        INSERT INTO items (id, name_kr, description, slots, updated_at)
        VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET
            description = EXCLUDED.description,
            slots = EXCLUDED.slots,
            updated_at = EXCLUDED.updated_at
    """
    
    for i in range(0, len(items_list), batch_size):
        batch = items_list[i : i + batch_size]
        
        # Prepare parameters for batch
        params = [(item_id, d['name_kr'], d['description'], d['slots']) for item_id, d in batch]
        
        # High performance batch execution
        execute_batch(cur, query, params)
        
        conn.commit()
        count += len(batch)
        print(f"  Processed {count}/{len(items_data)} items...")

    cur.close()
    conn.close()
    print(f"Migration complete. Total: {count}")


if __name__ == "__main__":
    force = '--force' in sys.argv
    test_mode = '--test' in sys.argv
    
    if test_mode:
        idx = sys.argv.index('--test')
        ids_to_test = [int(x) for x in sys.argv[idx+1].split(',')] if len(sys.argv) > idx+1 else [470213, 11000]
        
        # We'll run a special version of parse inside test mode for logging
        with open(LUA_PATH, 'rb') as f:
            content = f.read()
        
        item_pattern = re.compile(rb'\[(\d+)\]\s*=\s*\{')
        matches = list(item_pattern.finditer(content))
        
        for i, match in enumerate(matches):
            item_id = int(match.group(1))
            if item_id in ids_to_test:
                start_pos = match.end()
                end_pos = matches[i+1].start() if i + 1 < len(matches) else len(content)
                block = content[start_pos:end_pos]
                
                print(f"\n[DEBUG] ID {item_id} Block Found (Size {len(block)}):")
                # print(block[:100].decode('ascii', errors='replace'))
                
                name_match = re.search(rb'identifiedDisplayName\s*=\s*"([^"]*)"', block)
                if name_match:
                    name_kr = decode_lua_bytes(name_match.group(1))
                    print(f"  Name_KR: {name_kr}")
                
                desc_match = re.search(rb'\s+identifiedDescriptionName\s*=\s*\{', block)
                if desc_match:
                    desc_start = desc_match.end()
                    desc_end = block.find(b'}', desc_start)
                    print(f"  Desc Start: {desc_start}, End: {desc_end}")
                    desc_content = block[desc_start:desc_end]
                    print(f"  Desc Content Preview: {desc_content[:100]!r}...")
                    
                    lines = re.findall(rb'"([^"]*)"', desc_content)
                    print(f"  Lines Found: {len(lines)}")
                    decoded_lines = [decode_lua_bytes(l) for l in lines]
                    print(f"  First Line: {decoded_lines[0] if decoded_lines else 'NONE'}")
                    description = "\n".join(decoded_lines)
                    print(f"  Full Desc (First 200 chars):\n{description[:200]}")
                else:
                    print("  Identified Description NOT FOUND in block.")
    else:
        items_data = parse_lua_binary(LUA_PATH)
        if items_data:
            if force:
                migrate_to_pg(items_data)
            else:
                print(f"Found {len(items_data)} items.")
                print("Run with --force to migrate to production.")
