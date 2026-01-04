package com.ragnarok.ragspringbackend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Cache configuration with Caffeine.
 * - vendingSearch: 20 second TTL to keep data fresh
 * - Maximum 10,000 entries to prevent memory bloat
 */
@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager("vendingSearch");
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .expireAfterWrite(60, TimeUnit.SECONDS) // 60 second TTL
                .maximumSize(10_000)
                .recordStats()); // Enable stats for monitoring

        System.out.println("[CacheConfig] Caffeine cache initialized: vendingSearch TTL=60s, maxSize=10000");
        return cacheManager;
    }
}
