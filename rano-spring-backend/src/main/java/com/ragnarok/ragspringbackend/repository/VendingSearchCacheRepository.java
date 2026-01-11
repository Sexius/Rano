package com.ragnarok.ragspringbackend.repository;

import com.ragnarok.ragspringbackend.entity.VendingSearchCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface VendingSearchCacheRepository extends JpaRepository<VendingSearchCache, Long> {

    /**
     * 유효한 캐시 조회 (expires_at > now)
     */
    @Query("SELECT c FROM VendingSearchCache c WHERE c.cacheKey = :cacheKey AND c.expiresAt > :now")
    Optional<VendingSearchCache> findValidCache(
        @Param("cacheKey") String cacheKey,
        @Param("now") OffsetDateTime now
    );

    /**
     * cache_key로 기존 캐시 조회 (upsert용)
     */
    Optional<VendingSearchCache> findByCacheKey(String cacheKey);

    /**
     * 만료된 캐시 정리
     */
    @Modifying
    @Query("DELETE FROM VendingSearchCache c WHERE c.expiresAt < :now")
    int deleteExpiredCache(@Param("now") OffsetDateTime now);
}
