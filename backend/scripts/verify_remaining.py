"""
Remaining Items Verification Script
DB 기준 미채움 아이템 75건 정확히 식별 및 목록화
"""

import sqlite3
import csv
import os

DB_PATH = "ro_market.db"
OUTPUT_CSV = "scripts/remaining_items_verified.csv"
PREVIOUS_FILE = "scripts/failures/remaining_items.txt"

def get_remaining_items(conn):
    """DB에서 미채움 아이템 조회"""
    cursor = conn.cursor()
    
    # type 컬럼 존재 확인
    cursor.execute("PRAGMA table_info(items)")
    columns = {row[1] for row in cursor.fetchall()}
    has_type = 'type' in columns
    
    if has_type:
        query = """
            SELECT id, name_kr, slots, type, source
            FROM items
            WHERE description IS NULL OR TRIM(description) = ''
            ORDER BY id ASC
        """
    else:
        query = """
            SELECT id, name_kr, slots, NULL as type, source
            FROM items
            WHERE description IS NULL OR TRIM(description) = ''
            ORDER BY id ASC
        """
    
    cursor.execute(query)
    return cursor.fetchall(), has_type

def load_previous_list():
    """이전 failure 목록에서 item_id 로드"""
    if not os.path.exists(PREVIOUS_FILE):
        return set()
    
    item_ids = set()
    with open(PREVIOUS_FILE, 'r', encoding='utf-8') as f:
        for line in f:
            if line.startswith('#') or not line.strip():
                continue
            parts = line.strip().split('\t')
            if parts:
                try:
                    item_ids.add(int(parts[0]))
                except ValueError:
                    continue
    return item_ids

def main():
    print("=" * 70)
    print("REMAINING ITEMS VERIFICATION")
    print("DB 기준 미채움 아이템 목록화")
    print("=" * 70)
    
    conn = sqlite3.connect(DB_PATH)
    
    # 1) DB에서 미채움 아이템 조회
    print("\n[1] DB 조회")
    print(f"    조건: description IS NULL OR TRIM(description) = ''")
    print(f"    정렬: item_id ASC")
    
    items, has_type = get_remaining_items(conn)
    
    print(f"\n[2] 결과 row 수: {len(items)}")
    if len(items) == 75:
        print(f"    ✅ 정확히 75건 확인")
    else:
        print(f"    ⚠️ 75건 아님! 실제: {len(items)}건")
    
    # 2) 이전 목록과 교차 비교
    print(f"\n[3] 이전 목록 교차 비교")
    previous_ids = load_previous_list()
    current_ids = {item[0] for item in items}
    
    if previous_ids:
        print(f"    이전 목록 (remaining_items.txt): {len(previous_ids)}건")
        print(f"    현재 DB 조회: {len(current_ids)}건")
        
        only_in_previous = previous_ids - current_ids
        only_in_current = current_ids - previous_ids
        
        if only_in_previous:
            print(f"    ⚠️ 이전에만 있음 (현재 채워짐): {len(only_in_previous)}건")
            for item_id in sorted(only_in_previous)[:5]:
                print(f"       - {item_id}")
        
        if only_in_current:
            print(f"    ⚠️ 현재에만 있음 (새로 추가됨): {len(only_in_current)}건")
            for item_id in sorted(only_in_current)[:5]:
                print(f"       - {item_id}")
        
        if not only_in_previous and not only_in_current:
            print(f"    ✅ 완전 일치")
    else:
        print(f"    이전 목록 파일 없음")
    
    # 3) CSV 저장
    print(f"\n[4] CSV 저장")
    os.makedirs(os.path.dirname(OUTPUT_CSV), exist_ok=True)
    
    with open(OUTPUT_CSV, 'w', encoding='utf-8-sig', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['item_id', 'name', 'slots', 'type', 'source'])
        for item in items:
            writer.writerow(item)
    
    print(f"    저장됨: {OUTPUT_CSV}")
    
    # 4) 콘솔 출력 (전체 목록)
    print(f"\n[5] 전체 목록 ({len(items)}건)")
    print("-" * 70)
    print(f"{'item_id':<10} {'name':<35} {'slots':<6} {'source':<15}")
    print("-" * 70)
    
    for item_id, name, slots, item_type, source in items:
        name_display = (name[:32] + '...') if name and len(name) > 35 else (name or 'NULL')
        print(f"{item_id:<10} {name_display:<35} {slots or 0:<6} {source or 'NULL':<15}")
    
    print("-" * 70)
    print(f"총 {len(items)}건")
    
    conn.close()
    
    print("\n" + "=" * 70)
    print("VERIFICATION COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    main()
