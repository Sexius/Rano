"""
Item DB Loader - Lua 기반 재적재 스크립트 (v2 - Fixed parser)
Source of Truth: iteminfo.lua (클라이언트 Lua 파일)

Fixed: Nested brace handling for identifiedDescriptionName
"""

import sqlite3
import re
import hashlib
import os
from datetime import datetime

# 설정
LUA_FILE_PATH = "scripts/extracted/iteminfo.lua"
DB_PATH = "ro_market.db"

def get_file_info(filepath):
    """파일 정보 수집: 크기, 라인수, SHA256"""
    size = os.path.getsize(filepath)
    
    with open(filepath, 'rb') as f:
        content = f.read()
        sha256 = hashlib.sha256(content).hexdigest()
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        line_count = sum(1 for _ in f)
    
    return {
        'size': size,
        'size_mb': round(size / (1024 * 1024), 2),
        'line_count': line_count,
        'sha256': sha256
    }

def decode_euckr_escape(text):
    """Lua escape sequence를 EUC-KR로 디코딩"""
    if not text:
        return text
    
    def replace_escape(match):
        byte_val = int(match.group(1))
        return chr(byte_val)
    
    # \NNN 형태의 escape sequence 처리
    decoded = re.sub(r'\\(\d{1,3})', replace_escape, text)
    
    try:
        # Latin-1 바이트 시퀀스를 EUC-KR로 디코딩
        byte_seq = decoded.encode('latin-1')
        return byte_seq.decode('euc-kr', errors='replace')
    except:
        return decoded

def parse_lua_items(filepath):
    """Lua 파일에서 아이템 정보 추출 (v2 - 개선된 파서)"""
    items = {}
    duplicates = 0
    parse_errors = 0
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # 아이템 블록 분리: [id] = { ... } 패턴으로 분리
    # 각 아이템은 '  [숫자] = {' 로 시작
    item_pattern = r'\[(\d+)\]\s*=\s*\{'
    
    # 모든 아이템 시작 위치 찾기
    item_starts = [(m.group(1), m.start(), m.end()) for m in re.finditer(item_pattern, content)]
    
    for i, (item_id_str, start, block_start) in enumerate(item_starts):
        item_id = int(item_id_str)
        
        if item_id in items:
            duplicates += 1
            continue
        
        # 다음 아이템이나 파일 끝까지의 블록 찾기
        if i + 1 < len(item_starts):
            next_start = item_starts[i + 1][1]
            block = content[block_start:next_start]
        else:
            block = content[block_start:]
        
        try:
            # identifiedDisplayName 추출
            name_match = re.search(r'identifiedDisplayName\s*=\s*"([^"]*)"', block)
            name = decode_euckr_escape(name_match.group(1)) if name_match else None
            
            # identifiedDescriptionName 추출 (중첩 브레이스 처리)
            desc_start_match = re.search(r'identifiedDescriptionName\s*=\s*\{', block)
            description = None
            
            if desc_start_match:
                # 시작 위치부터 매칭되는 닫는 브레이스 찾기
                desc_start = desc_start_match.end()
                brace_count = 1
                desc_end = desc_start
                
                for j in range(desc_start, len(block)):
                    if block[j] == '{':
                        brace_count += 1
                    elif block[j] == '}':
                        brace_count -= 1
                        if brace_count == 0:
                            desc_end = j
                            break
                
                desc_block = block[desc_start:desc_end]
                
                # 문자열 추출 (따옴표 안의 내용)
                desc_lines = re.findall(r'"([^"]*)"', desc_block)
                decoded_lines = [decode_euckr_escape(line) for line in desc_lines]
                description = '\n'.join(decoded_lines) if decoded_lines else None
            
            # slotCount 추출
            slot_match = re.search(r'slotCount\s*=\s*(\d+)', block)
            slots = int(slot_match.group(1)) if slot_match else 0
            
            items[item_id] = {
                'id': item_id,
                'name_kr': name,
                'description': description,
                'slots': slots
            }
        except Exception as e:
            parse_errors += 1
            if parse_errors <= 5:
                print(f"  Parse error for item {item_id}: {e}")
    
    return items, duplicates, parse_errors

def backup_items_table(conn):
    """items 테이블 백업"""
    timestamp = datetime.now().strftime('%Y%m%d%H%M')
    backup_table = f"items_backup_{timestamp}"
    
    cursor = conn.cursor()
    
    # 기존 테이블 구조 복사
    cursor.execute(f"""
        CREATE TABLE IF NOT EXISTS {backup_table} AS 
        SELECT * FROM items
    """)
    
    cursor.execute(f"SELECT COUNT(*) FROM {backup_table}")
    backup_count = cursor.fetchone()[0]
    
    conn.commit()
    return backup_table, backup_count

def ensure_schema(conn):
    """source, source_updated_at 컬럼 존재 확인 및 추가"""
    cursor = conn.cursor()
    
    # 현재 컬럼 확인
    cursor.execute("PRAGMA table_info(items)")
    columns = {row[1] for row in cursor.fetchall()}
    
    if 'source' not in columns:
        cursor.execute("ALTER TABLE items ADD COLUMN source VARCHAR(20) DEFAULT 'LUA'")
        print("[SCHEMA] Added 'source' column")
    
    if 'source_updated_at' not in columns:
        cursor.execute("ALTER TABLE items ADD COLUMN source_updated_at TIMESTAMP")
        print("[SCHEMA] Added 'source_updated_at' column")
    
    conn.commit()

def truncate_items(conn):
    """items 테이블 TRUNCATE (SQLite에서는 DELETE 사용)"""
    cursor = conn.cursor()
    cursor.execute("DELETE FROM items")
    conn.commit()
    print("[TRUNCATE] items table cleared")

def insert_items(conn, items):
    """아이템 bulk insert"""
    cursor = conn.cursor()
    
    now = datetime.now().isoformat()
    data = [
        (
            item['id'],
            item['name_kr'],
            item['description'],
            item['slots'],
            'LUA',
            now,
            now
        )
        for item in items.values()
    ]
    
    cursor.executemany("""
        INSERT OR REPLACE INTO items 
        (id, name_kr, description, slots, source, source_updated_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, data)
    
    conn.commit()
    return len(data)

def verify_results(conn):
    """검증 쿼리 실행"""
    cursor = conn.cursor()
    
    # 전체 아이템 수
    cursor.execute("SELECT COUNT(*) FROM items")
    total = cursor.fetchone()[0]
    
    # description NULL 비율
    cursor.execute("SELECT COUNT(*) FROM items WHERE description IS NULL")
    null_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM items WHERE description = '' OR TRIM(description) = ''")
    empty_count = cursor.fetchone()[0]
    
    # 길이 통계
    cursor.execute("""
        SELECT MIN(LENGTH(description)), MAX(LENGTH(description)), ROUND(AVG(LENGTH(description)), 1)
        FROM items WHERE description IS NOT NULL AND TRIM(description) != ''
    """)
    min_len, max_len, avg_len = cursor.fetchone()
    
    # source별 분포
    cursor.execute("SELECT source, COUNT(*) FROM items GROUP BY source")
    source_dist = cursor.fetchall()
    
    # 샘플 아이템 (description 있는 것)
    cursor.execute("""
        SELECT id, name_kr, LENGTH(description), SUBSTR(description, 1, 50) 
        FROM items 
        WHERE description IS NOT NULL AND LENGTH(description) > 0
        LIMIT 3
    """)
    samples = cursor.fetchall()
    
    return {
        'total': total,
        'null_count': null_count,
        'empty_count': empty_count,
        'min_len': min_len,
        'max_len': max_len,
        'avg_len': avg_len,
        'source_dist': source_dist,
        'samples': samples
    }

def main():
    print("=" * 60)
    print("ITEM DB RELOAD FROM LUA SOURCE (v2 - Fixed Parser)")
    print("=" * 60)
    
    # 1. Lua 파일 검증
    print("\n[PHASE 1] Lua File Validation")
    info = get_file_info(LUA_FILE_PATH)
    print(f"  File: {LUA_FILE_PATH}")
    print(f"  Size: {info['size_mb']} MB ({info['size']:,} bytes)")
    print(f"  Lines: {info['line_count']:,}")
    print(f"  SHA256: {info['sha256'][:16]}...{info['sha256'][-16:]}")
    
    # 2. Lua 파싱
    print("\n[PHASE 2] Lua Parsing (v2)")
    items, duplicates, parse_errors = parse_lua_items(LUA_FILE_PATH)
    
    item_ids = sorted(items.keys())
    print(f"  Total items parsed: {len(items):,}")
    print(f"  Duplicates skipped: {duplicates}")
    print(f"  Parse errors: {parse_errors}")
    print(f"  First item_id: {item_ids[0] if item_ids else 'N/A'}")
    print(f"  Last item_id: {item_ids[-1] if item_ids else 'N/A'}")
    
    # 파싱 샘플 확인
    if item_ids:
        sample_id = item_ids[0]
        sample = items[sample_id]
        desc_preview = sample['description'][:50] if sample['description'] else 'NULL'
        print(f"  Sample [{sample_id}]: {sample['name_kr']}")
        print(f"    Description: {desc_preview}...")
    
    # 파싱된 description 통계
    with_desc = sum(1 for item in items.values() if item['description'])
    print(f"  Items with description: {with_desc:,} ({round(100*with_desc/len(items),1)}%)")
    
    # 3. DB 작업
    print("\n[PHASE 3] Database Operations")
    conn = sqlite3.connect(DB_PATH)
    
    # 스키마 확인/추가
    ensure_schema(conn)
    
    # 백업 (이미 있으면 스킵)
    backup_table, backup_count = backup_items_table(conn)
    print(f"  Backup created: {backup_table} ({backup_count:,} rows)")
    
    # TRUNCATE
    truncate_items(conn)
    
    # Insert
    inserted = insert_items(conn, items)
    print(f"  Inserted: {inserted:,} items")
    
    # 4. 검증
    print("\n[PHASE 4] Verification")
    results = verify_results(conn)
    print(f"  Total items: {results['total']:,}")
    print(f"  Description NULL: {results['null_count']:,}")
    print(f"  Description empty: {results['empty_count']:,}")
    print(f"  Length stats: MIN={results['min_len']}, MAX={results['max_len']}, AVG={results['avg_len']}")
    print(f"  Source distribution:")
    for source, count in results['source_dist']:
        print(f"    - {source}: {count:,}")
    
    if results['samples']:
        print("\n  Sample items with description:")
        for item_id, name, length, desc_preview in results['samples']:
            print(f"    [{item_id}] {name} (len={length}): {desc_preview}...")
    
    conn.close()
    
    print("\n" + "=" * 60)
    print("RELOAD COMPLETE (v2)")
    print("=" * 60)
    
    return results

if __name__ == "__main__":
    main()
