package com.ragnarok.ragspringbackend.repository;

import com.ragnarok.ragspringbackend.entity.VendingListing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 노점 스냅샷 조회 (검색 API용)
 * 모든 검색은 DB만 조회, 외부 fetch 없음
 */
@Repository
public interface VendingListingRepository extends JpaRepository<VendingListing, Long> {

    // 1. Prefix 검색 (1차 - 빠름)
    @Query("SELECT v FROM VendingListing v WHERE v.server = :server AND v.itemName LIKE :keyword% ORDER BY v.scrapedAt DESC")
    Page<VendingListing> findByServerAndItemNamePrefix(
        @Param("server") String server, 
        @Param("keyword") String keyword, 
        Pageable pageable
    );

    // 2. 부분 검색 (2차 - pg_trgm 인덱스 활용)
    @Query("SELECT v FROM VendingListing v WHERE v.server = :server AND v.itemName LIKE %:keyword% ORDER BY v.scrapedAt DESC")
    Page<VendingListing> findByServerAndItemNameContaining(
        @Param("server") String server, 
        @Param("keyword") String keyword, 
        Pageable pageable
    );

    // 3. 전체 서버 검색 (prefix)
    @Query("SELECT v FROM VendingListing v WHERE v.itemName LIKE :keyword% ORDER BY v.scrapedAt DESC")
    Page<VendingListing> findByItemNamePrefix(@Param("keyword") String keyword, Pageable pageable);

    // 4. 최신 scraped_at 조회 (데이터 신선도 확인)
    @Query("SELECT MAX(v.scrapedAt) FROM VendingListing v WHERE v.server = :server")
    Optional<LocalDateTime> findLatestScrapedAt(@Param("server") String server);

    // 5. 특정 키워드 최신 scraped_at
    @Query("SELECT MAX(v.scrapedAt) FROM VendingListing v WHERE v.server = :server AND v.itemName LIKE :keyword%")
    Optional<LocalDateTime> findLatestScrapedAtByKeyword(
        @Param("server") String server, 
        @Param("keyword") String keyword
    );

    // 6. 카운트 (페이징용)
    @Query("SELECT COUNT(v) FROM VendingListing v WHERE v.server = :server AND v.itemName LIKE :keyword%")
    long countByServerAndItemNamePrefix(@Param("server") String server, @Param("keyword") String keyword);

    // 7. Upsert 용 조회 (수집 잡에서 사용) - price 포함
    Optional<VendingListing> findByServerAndMapIdAndSsiAndItemNameAndPrice(
        String server, String mapId, String ssi, String itemName, Long price
    );

    // 8. 오래된 데이터 삭제 (정리용)
    @Modifying
    @Query("DELETE FROM VendingListing v WHERE v.scrapedAt < :cutoff")
    int deleteOlderThan(@Param("cutoff") LocalDateTime cutoff);
}
