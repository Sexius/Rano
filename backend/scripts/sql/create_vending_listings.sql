-- ============================================================
-- vending_listings 테이블: 크롤링된 노점 데이터 스냅샷
-- PostgreSQL 버전
-- ============================================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS vending_listings (
    id BIGSERIAL PRIMARY KEY,
    
    -- 위치/식별
    server VARCHAR(20) NOT NULL,           -- 'baphomet', 'ifrit'
    map_id VARCHAR(50),                     -- 크롤링 원본의 mapID
    ssi VARCHAR(50),                        -- 크롤링 원본의 ssi (상세보기용)
    
    -- 아이템 정보
    item_name VARCHAR(255) NOT NULL,        -- 크롤링된 아이템명 (원본 그대로)
    item_name_normalized VARCHAR(255),      -- 검색용 정규화 이름 (prefix 검색용)
    item_id INTEGER,                        -- Item DB 매칭된 ID (nullable)
    
    -- 거래 정보
    price BIGINT NOT NULL,
    amount INTEGER DEFAULT 1,
    
    -- 판매자 정보
    shop_name VARCHAR(255),                 -- 노점 이름
    seller_name VARCHAR(255),               -- 판매자 캐릭터명
    
    -- 메타
    scraped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source_page INTEGER DEFAULT 1,
    
    -- 중복 방지: map_id + ssi + item_name + price 기준
    -- (동일 노점의 동일 아이템+가격은 1개만 저장)
    CONSTRAINT uq_vending_listing UNIQUE (server, map_id, ssi, item_name, price)
);

-- 2. 인덱스

-- 2a. 검색용: server + item_name prefix (LIKE 'keyword%')
CREATE INDEX IF NOT EXISTS idx_vending_server_item 
ON vending_listings(server, item_name varchar_pattern_ops);

-- 2b. 검색용: item_name_normalized prefix
CREATE INDEX IF NOT EXISTS idx_vending_normalized 
ON vending_listings(item_name_normalized varchar_pattern_ops);

-- 2c. 최신 데이터 조회용
CREATE INDEX IF NOT EXISTS idx_vending_server_scraped 
ON vending_listings(server, scraped_at DESC);

-- 2d. item_id 조회용 (아이콘 매칭 확인)
CREATE INDEX IF NOT EXISTS idx_vending_item_id 
ON vending_listings(item_id) WHERE item_id IS NOT NULL;

-- 3. pg_trgm 확장 (부분검색 %keyword% 최적화)
-- 관리자 권한 필요, 한 번만 실행
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 3a. Trigram 인덱스 (부분검색용 - 선택적)
CREATE INDEX IF NOT EXISTS idx_vending_item_trgm 
ON vending_listings USING gin (item_name gin_trgm_ops);


-- ============================================================
-- MariaDB/MySQL 버전 (분기)
-- ============================================================
/*
CREATE TABLE IF NOT EXISTS vending_listings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    server VARCHAR(20) NOT NULL,
    map_id VARCHAR(50),
    ssi VARCHAR(50),
    
    item_name VARCHAR(255) NOT NULL,
    item_name_normalized VARCHAR(255),
    item_id INT,
    
    price BIGINT NOT NULL,
    amount INT DEFAULT 1,
    
    shop_name VARCHAR(255),
    seller_name VARCHAR(255),
    
    scraped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    source_page INT DEFAULT 1,
    
    UNIQUE KEY uq_vending_listing (server, map_id, ssi, item_name),
    
    INDEX idx_vending_server_item (server, item_name),
    INDEX idx_vending_normalized (item_name_normalized),
    INDEX idx_vending_server_scraped (server, scraped_at),
    INDEX idx_vending_item_id (item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MariaDB 부분검색: FULLTEXT 인덱스 사용
ALTER TABLE vending_listings ADD FULLTEXT INDEX ft_item_name (item_name);
*/


-- ============================================================
-- 인덱스 전략 비교
-- ============================================================
-- 
-- | 검색 유형       | 인덱스             | 예상 속도   |
-- |-----------------|-------------------|------------|
-- | prefix (keyword%) | varchar_pattern_ops | O(log n) 매우 빠름 |
-- | 부분 (%keyword%)  | gin_trgm_ops      | O(n/k) 빠름 |
-- | 부분 (no index)   | full scan         | O(n) 느림  |
--
-- 권장: 1차 prefix 검색, 결과 부족 시 2차 trgm 검색
