import sqlite3

conn = sqlite3.connect('ro_market.db')
c = conn.cursor()

# Total items
c.execute('SELECT COUNT(*) FROM items')
total = c.fetchone()[0]

# NULL count
c.execute("SELECT COUNT(*) FROM items WHERE description IS NULL")
null_count = c.fetchone()[0]

# Empty string count
c.execute("SELECT COUNT(*) FROM items WHERE description = ''")
empty_count = c.fetchone()[0]

# Whitespace only count
c.execute("SELECT COUNT(*) FROM items WHERE TRIM(description) = '' AND description IS NOT NULL")
whitespace_count = c.fetchone()[0]

# Length stats
c.execute("""
    SELECT 
        MIN(LENGTH(description)),
        MAX(LENGTH(description)),
        ROUND(AVG(LENGTH(description)), 1)
    FROM items 
    WHERE description IS NOT NULL AND TRIM(description) != ''
""")
min_len, max_len, avg_len = c.fetchone()

# Source distribution
c.execute("SELECT source, COUNT(*) FROM items GROUP BY source")
source_dist = c.fetchall()

# Backup info
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'items_backup_%'")
backups = [(name,) for (name,) in c.fetchall()]

conn.close()

# Print results
print(f"TOTAL: {total}")
print(f"NULL_DESC: {null_count}")
print(f"EMPTY_STRING: {empty_count}")
print(f"WHITESPACE_ONLY: {whitespace_count}")
print(f"MIN_LEN: {min_len}")
print(f"MAX_LEN: {max_len}")
print(f"AVG_LEN: {avg_len}")
print(f"SOURCE: {source_dist}")
print(f"BACKUPS: {backups}")
