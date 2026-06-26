package com.ragnarok.ragspringbackend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseInitializer.class);
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public DatabaseInitializer(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) throws Exception {
        try (Connection conn = dataSource.getConnection()) {
            String dbName = conn.getMetaData().getDatabaseProductName().toLowerCase();
            
            if (dbName.contains("postgresql")) {
                logger.info("[DatabaseInitializer] PostgreSQL detected. Applying pg_trgm index for search optimization...");
                
                // 1. pg_trgm 확장 활성화 (Render 등 대부분의 클라우드 DB에서 지원)
                jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;");
                
                // 2. GIN 인덱스 생성 (LIKE '%keyword%' 검색 속도 대폭 향상)
                jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS trgm_idx_vending_item_name ON vending_listings USING gin (item_name gin_trgm_ops);");
                
                logger.info("[DatabaseInitializer] pg_trgm extension and index applied successfully.");
            } else {
                logger.info("[DatabaseInitializer] Database is {}, skipping PostgreSQL specific indexes.", dbName);
            }
        } catch (Exception e) {
            logger.error("[DatabaseInitializer] Failed to apply database optimizations: {}", e.getMessage());
        }
    }
}
