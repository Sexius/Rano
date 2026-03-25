"""
Divine Pride Collection Script v2 - Enhanced with Retry Modes

사용법:
  # 남은 미채움 전체 수집
  python collect_divine_pride.py
  
  # 특정 실패 유형만 재시도
  python collect_divine_pride.py --only-failures network
  python collect_divine_pride.py --only-failures 404 --server global
  
  # 분석 모드 (실패 파일 생성)
  python collect_divine_pride.py --analyze-only
"""

import sqlite3
import requests
import time
import os
import argparse
from datetime import datetime
import random
import json

# 설정
DB_PATH = "ro_market.db"
DIVINE_PRIDE_API_URL = "https://www.divine-pride.net/api/database/Item/{item_id}"
FAILURES_DIR = "scripts/failures"
DEFAULT_SERVER = "kROM"

def get_api_key():
    """환경변수에서 API 키 가져오기"""
    key = os.environ.get("DIVINE_PRIDE_API_KEY")
    if not key:
        key = "403eb0a63c53841742499eeba421b8b6"
    return key

def ensure_failures_dir():
    """실패 파일 디렉토리 생성"""
    os.makedirs(FAILURES_DIR, exist_ok=True)

def get_remaining_count(conn):
    """남은 미채움 합집합 건수"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) FROM items
        WHERE description IS NULL OR TRIM(description) = ''
    """)
    return cursor.fetchone()[0]

def get_target_items(conn, limit=None, only_failures=None):
    """대상 아이템 목록 조회"""
    cursor = conn.cursor()
    
    if only_failures:
        # 실패 파일에서 item_id 로드
        filepath = os.path.join(FAILURES_DIR, f"failures_{only_failures}.txt")
        if not os.path.exists(filepath):
            print(f"  [ERROR] Failure file not found: {filepath}")
            return []
        
        with open(filepath, 'r') as f:
            item_ids = [int(line.strip().split('\t')[0]) for line in f if line.strip() and not line.startswith('#')]
        
        if not item_ids:
            return []
        
        placeholders = ','.join(['?' for _ in item_ids])
        query = f"""
            SELECT id, name_kr, source
            FROM items
            WHERE id IN ({placeholders})
              AND (description IS NULL OR TRIM(description) = '')
            ORDER BY id
        """
        cursor.execute(query, item_ids)
    else:
        query = """
            SELECT id, name_kr, source
            FROM items
            WHERE description IS NULL OR TRIM(description) = ''
            ORDER BY id
        """
        cursor.execute(query)
    
    results = cursor.fetchall()
    
    if limit:
        results = results[:limit]
    
    return results

def fetch_from_divine_pride(item_id, api_key, server=DEFAULT_SERVER, max_retries=2):
    """Divine Pride API에서 아이템 정보 가져오기"""
    url = DIVINE_PRIDE_API_URL.format(item_id=item_id)
    params = {"apiKey": api_key}
    
    if server and server != "global":
        params["server"] = server
    
    headers = {
        "User-Agent": "Mozilla/5.0",
        "Accept-Language": "ko-KR,ko;q=0.9"
    }
    
    for attempt in range(max_retries + 1):
        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            
            if response.status_code == 200:
                return {"success": True, "data": response.json(), "error_type": None}
            elif response.status_code == 404:
                return {"success": False, "error": "NOT_FOUND", "error_type": "404", "status": 404}
            elif response.status_code == 429:
                if attempt < max_retries:
                    time.sleep((2 ** attempt) + random.uniform(0.5, 1.5))
                    continue
                return {"success": False, "error": "RATE_LIMITED", "error_type": "network", "status": 429}
            elif response.status_code >= 500:
                if attempt < max_retries:
                    time.sleep((2 ** attempt) + random.uniform(0.5, 1.5))
                    continue
                return {"success": False, "error": "SERVER_ERROR", "error_type": "network", "status": response.status_code}
            else:
                return {"success": False, "error": f"HTTP_{response.status_code}", "error_type": "network", "status": response.status_code}
                
        except requests.exceptions.Timeout:
            if attempt < max_retries:
                time.sleep(1)
                continue
            return {"success": False, "error": "TIMEOUT", "error_type": "network", "status": None}
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": str(e), "error_type": "network", "status": None}
    
    return {"success": False, "error": "MAX_RETRIES", "error_type": "network", "status": None}

def clean_description(description):
    """Divine Pride 설명 정리"""
    if not description:
        return None
    import re
    cleaned = re.sub(r'\^[0-9a-fA-F]{6}', '', description)
    return cleaned.strip() if cleaned.strip() else None

def update_item_description(conn, item_id, description):
    """아이템 description 업데이트"""
    cursor = conn.cursor()
    now = datetime.now().isoformat()
    
    cursor.execute("""
        UPDATE items 
        SET description = ?, source = 'DIVINE_PRIDE', source_updated_at = ?, updated_at = ?
        WHERE id = ?
          AND (description IS NULL OR TRIM(description) = '')
    """, (description, now, now, item_id))
    
    conn.commit()
    return cursor.rowcount > 0

def save_failures(failures_404, failures_empty, failures_network):
    """실패 목록 파일 저장"""
    ensure_failures_dir()
    
    def write_file(filename, items, header):
        filepath = os.path.join(FAILURES_DIR, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"# {header}\n")
            f.write(f"# Generated: {datetime.now().isoformat()}\n")
            f.write(f"# Count: {len(items)}\n")
            f.write("# Format: item_id\\tname\\terror\n")
            for item in items:
                f.write(f"{item['id']}\t{item['name']}\t{item['error']}\n")
        return filepath
    
    paths = []
    paths.append(write_file("failures_404.txt", failures_404, "404 NOT FOUND - Divine Pride에 없는 아이템"))
    paths.append(write_file("failures_empty.txt", failures_empty, "EMPTY RESPONSE - 응답에 description 없음"))
    paths.append(write_file("failures_network.txt", failures_network, "NETWORK ERROR - 재시도 가능"))
    
    return paths

def save_remaining_list(conn):
    """최종 remaining 목록 저장"""
    ensure_failures_dir()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name_kr, source
        FROM items
        WHERE description IS NULL OR TRIM(description) = ''
        ORDER BY id
    """)
    items = cursor.fetchall()
    
    filepath = os.path.join(FAILURES_DIR, "remaining_items.txt")
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(f"# Remaining items with empty description\n")
        f.write(f"# Generated: {datetime.now().isoformat()}\n")
        f.write(f"# Count: {len(items)}\n")
        f.write("# Format: item_id\\tname\\tsource\n")
        for item_id, name, source in items:
            f.write(f"{item_id}\t{name}\t{source}\n")
    
    return filepath, len(items)

def main():
    parser = argparse.ArgumentParser(description="Divine Pride Batch Collection v2")
    parser.add_argument("--limit", type=int, default=None, help="Max items to process")
    parser.add_argument("--server", default=DEFAULT_SERVER, help="Divine Pride server (kROM, kRO, global)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without updating DB")
    parser.add_argument("--only-failures", choices=["404", "empty", "network"], help="Retry only specific failure type")
    parser.add_argument("--analyze-only", action="store_true", help="Only analyze and save failure files")
    args = parser.parse_args()
    
    api_key = get_api_key()
    
    print("=" * 60)
    print("DIVINE PRIDE COLLECTION v2")
    print("=" * 60)
    print(f"  Server: {args.server}")
    print(f"  Limit: {args.limit or 'ALL'}")
    print(f"  Dry-run: {args.dry_run}")
    print(f"  Only-failures: {args.only_failures or 'None'}")
    print(f"  Analyze-only: {args.analyze_only}")
    
    conn = sqlite3.connect(DB_PATH)
    
    # 1) 남은 미채움 합집합 건수
    remaining_before = get_remaining_count(conn)
    print(f"\n[REMAINING COUNT] {remaining_before} items (NULL or TRIM='')")
    
    if args.analyze_only:
        # 분석만 실행
        targets = get_target_items(conn)
        print(f"\n[ANALYZE] Processing {len(targets)} items...")
        
        failures_404 = []
        failures_empty = []
        failures_network = []
        
        for i, (item_id, name_kr, source) in enumerate(targets):
            if (i + 1) % 20 == 0:
                print(f"  Progress: {i + 1}/{len(targets)}")
            
            if i > 0:
                time.sleep(random.uniform(0.2, 0.5))
            
            result = fetch_from_divine_pride(item_id, api_key, args.server)
            
            if not result["success"]:
                item_info = {"id": item_id, "name": name_kr, "error": result["error"]}
                if result["error_type"] == "404":
                    failures_404.append(item_info)
                elif result["error_type"] == "network":
                    failures_network.append(item_info)
                continue
            
            description = clean_description(result["data"].get("description", ""))
            if not description:
                failures_empty.append({"id": item_id, "name": name_kr, "error": "EMPTY_RESPONSE"})
        
        # 저장
        paths = save_failures(failures_404, failures_empty, failures_network)
        remaining_path, remaining_count = save_remaining_list(conn)
        
        print(f"\n[SAVED FILES]")
        for p in paths:
            print(f"  - {p}")
        print(f"  - {remaining_path}")
        
        print(f"\n[FAILURE SUMMARY]")
        print(f"  404 NOT FOUND: {len(failures_404)}")
        print(f"  EMPTY RESPONSE: {len(failures_empty)}")
        print(f"  NETWORK ERROR: {len(failures_network)}")
        print(f"  TOTAL REMAINING: {remaining_count}")
        
        conn.close()
        return
    
    # 일반 수집 모드
    targets = get_target_items(conn, args.limit, args.only_failures)
    print(f"[TARGET] {len(targets)} items")
    
    if not targets:
        print("\nNo items to process!")
        conn.close()
        return
    
    stats = {"success": 0, "skipped_empty": 0, "failed_404": 0, "failed_network": 0}
    failures_404 = []
    failures_empty = []
    failures_network = []
    
    print("\n[PROCESSING]")
    for i, (item_id, name_kr, source) in enumerate(targets):
        if (i + 1) % 10 == 0 or i == 0:
            print(f"  Progress: {i + 1}/{len(targets)}")
        
        if i > 0:
            time.sleep(random.uniform(0.2, 0.5))
        
        result = fetch_from_divine_pride(item_id, api_key, args.server)
        
        if not result["success"]:
            item_info = {"id": item_id, "name": name_kr, "error": result["error"]}
            if result["error_type"] == "404":
                stats["failed_404"] += 1
                failures_404.append(item_info)
            else:
                stats["failed_network"] += 1
                failures_network.append(item_info)
            continue
        
        description = clean_description(result["data"].get("description", ""))
        
        if not description:
            stats["skipped_empty"] += 1
            failures_empty.append({"id": item_id, "name": name_kr, "error": "EMPTY_RESPONSE"})
            continue
        
        if args.dry_run:
            print(f"    [DRY-RUN] Would update [{item_id}] {name_kr}")
            stats["success"] += 1
        else:
            if update_item_description(conn, item_id, description):
                stats["success"] += 1
    
    # 실패 파일 저장
    paths = save_failures(failures_404, failures_empty, failures_network)
    
    remaining_after = get_remaining_count(conn)
    remaining_path, _ = save_remaining_list(conn)
    
    conn.close()
    
    # 리포트
    print("\n" + "=" * 60)
    print("COLLECTION REPORT")
    print("=" * 60)
    print(f"\n[STATISTICS]")
    print(f"  Processed: {len(targets)}")
    print(f"  Success: {stats['success']}")
    print(f"  Skipped (empty response): {stats['skipped_empty']}")
    print(f"  Failed (404): {stats['failed_404']}")
    print(f"  Failed (network): {stats['failed_network']}")
    
    print(f"\n[BEFORE/AFTER]")
    print(f"  Before: {remaining_before}")
    print(f"  After:  {remaining_after}")
    print(f"  Filled: {remaining_before - remaining_after}")
    
    print(f"\n[SAVED FILES]")
    for p in paths:
        print(f"  - {p}")
    print(f"  - {remaining_path}")
    
    print("\n" + "=" * 60)
    print("COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
