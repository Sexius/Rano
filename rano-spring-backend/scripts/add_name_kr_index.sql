-- Add index on items.name_kr for faster lookups
-- This is a safety measure; primary optimization is in-memory cache

CREATE INDEX IF NOT EXISTS idx_items_name_kr ON items(name_kr);

-- Verify index
-- EXPLAIN ANALYZE SELECT id FROM items WHERE name_kr = '천공 서클릿';
