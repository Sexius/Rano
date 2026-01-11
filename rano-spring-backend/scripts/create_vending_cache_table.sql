-- vending_search_cache 테이블 생성
-- 검색 결과 페이지 단위 캐시 (GNJOY 동일성 100% 보장)

CREATE TABLE IF NOT EXISTS vending_search_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(512) NOT NULL UNIQUE,
    server VARCHAR(32) NOT NULL,
    keyword VARCHAR(128) NOT NULL,
    page INTEGER NOT NULL DEFAULT 1,
    size INTEGER NOT NULL DEFAULT 10,
    inclusion INTEGER NOT NULL DEFAULT 1,
    item_order VARCHAR(32) NOT NULL DEFAULT 'price',
    result_json JSONB NOT NULL,
    total_count INTEGER NOT NULL DEFAULT 0,
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes')
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_vending_cache_expires ON vending_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_vending_cache_server_keyword ON vending_search_cache(server, keyword);
CREATE INDEX IF NOT EXISTS idx_vending_cache_key ON vending_search_cache(cache_key);

-- 만료된 캐시 정리용 (선택적 cron job에서 사용)
-- DELETE FROM vending_search_cache WHERE expires_at < NOW();
