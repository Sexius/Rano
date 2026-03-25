import sqlite3

conn = sqlite3.connect('ro_market.db')
c = conn.cursor()

print("=" * 60)
print("ITEM DB VERIFICATION REPORT (DETAILED)")
print("=" * 60)

# Total items
c.execute('SELECT COUNT(*) FROM items')
total = c.fetchone()[0]
print(f"\n[1] Total items: {total:,}")

# --- Description Analysis ---
print("\n[2] Description Analysis:")

# NULL count
c.execute("SELECT COUNT(*) FROM items WHERE description IS NULL")
null_count = c.fetchone()[0]
print(f"    - NULL: {null_count:,}")

# Empty string count
c.execute("SELECT COUNT(*) FROM items WHERE description = ''")
empty_count = c.fetchone()[0]
print(f"    - Empty string (''): {empty_count:,}")

# Whitespace only count
c.execute("SELECT COUNT(*) FROM items WHERE TRIM(description) = '' AND description IS NOT NULL")
whitespace_count = c.fetchone()[0]
print(f"    - Whitespace only (TRIM=''): {whitespace_count:,}")

# Combined: needs Divine Pride fill
needs_fill = null_count + empty_count + whitespace_count
needs_fill_pct = round(100.0 * needs_fill / total, 2) if total > 0 else 0
print(f"    => Total needing Divine Pride fill: {needs_fill:,} ({needs_fill_pct}%)")

# --- Description Length Distribution ---
print("\n[3] Description Length Distribution:")
c.execute("""
    SELECT 
        MIN(LENGTH(description)),
        MAX(LENGTH(description)),
        ROUND(AVG(LENGTH(description)), 1)
    FROM items 
    WHERE description IS NOT NULL AND TRIM(description) != ''
""")
min_len, max_len, avg_len = c.fetchone()
print(f"    - MIN: {min_len} chars")
print(f"    - MAX: {max_len} chars")
print(f"    - AVG: {avg_len} chars")

# Length buckets
print("\n[4] Length Buckets:")
c.execute("""
    SELECT 
        CASE 
            WHEN LENGTH(description) = 0 THEN '0 (empty)'
            WHEN LENGTH(description) <= 50 THEN '1-50'
            WHEN LENGTH(description) <= 200 THEN '51-200'
            WHEN LENGTH(description) <= 500 THEN '201-500'
            ELSE '500+'
        END as bucket,
        COUNT(*) as cnt
    FROM items 
    WHERE description IS NOT NULL
    GROUP BY bucket
    ORDER BY 
        CASE bucket 
            WHEN '0 (empty)' THEN 1 
            WHEN '1-50' THEN 2 
            WHEN '51-200' THEN 3 
            WHEN '201-500' THEN 4 
            ELSE 5 
        END
""")
for bucket, cnt in c.fetchall():
    pct = round(100.0 * cnt / total, 1)
    print(f"    - {bucket}: {cnt:,} ({pct}%)")

# --- Source Distribution ---
print("\n[5] Source Distribution:")
c.execute("SELECT source, COUNT(*) FROM items GROUP BY source")
for source, count in c.fetchall():
    pct = round(100.0 * count / total, 2)
    print(f"    - {source}: {count:,} ({pct}%)")

# --- Sample items with short descriptions ---
print("\n[6] Sample items with short descriptions (length <= 20):")
c.execute("""
    SELECT id, name_kr, LENGTH(description), description 
    FROM items 
    WHERE description IS NOT NULL AND LENGTH(description) > 0 AND LENGTH(description) <= 20
    LIMIT 5
""")
for item_id, name, length, desc in c.fetchall():
    print(f"    [{item_id}] {name} (len={length}): {desc[:30]}...")

# --- Backup tables ---
print("\n[7] Backup Tables:")
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'items_backup_%'")
backups = c.fetchall()
for (name,) in backups:
    c.execute(f"SELECT COUNT(*) FROM {name}")
    cnt = c.fetchone()[0]
    print(f"    - {name}: {cnt:,} rows")

print("\n" + "=" * 60)
print("VERIFICATION COMPLETE")
print("=" * 60)

conn.close()
