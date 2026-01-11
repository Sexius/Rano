package com.ragnarok.ragspringbackend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

/**
 * 노점 검색 결과 캐시 엔티티
 * - GNJOY 검색 결과를 페이지 단위로 캐시
 * - TTL: 10분
 */
@Entity
@Table(name = "vending_search_cache", indexes = {
    @Index(name = "idx_vending_cache_expires", columnList = "expiresAt"),
    @Index(name = "idx_vending_cache_server_keyword", columnList = "server, keyword")
})
public class VendingSearchCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "cache_key", nullable = false, unique = true, length = 512)
    private String cacheKey;

    @Column(nullable = false, length = 32)
    private String server;

    @Column(nullable = false, length = 128)
    private String keyword;

    @Column(nullable = false)
    private Integer page = 1;

    @Column(nullable = false)
    private Integer size = 10;

    @Column(nullable = false)
    private Integer inclusion = 1;

    @Column(name = "item_order", nullable = false, length = 32)
    private String itemOrder = "price";

    @Column(name = "result_json", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String resultJson;

    @Column(name = "total_count", nullable = false)
    private Integer totalCount = 0;

    @Column(name = "cached_at", nullable = false)
    private OffsetDateTime cachedAt;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCacheKey() { return cacheKey; }
    public void setCacheKey(String cacheKey) { this.cacheKey = cacheKey; }

    public String getServer() { return server; }
    public void setServer(String server) { this.server = server; }

    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }

    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }

    public Integer getSize() { return size; }
    public void setSize(Integer size) { this.size = size; }

    public Integer getInclusion() { return inclusion; }
    public void setInclusion(Integer inclusion) { this.inclusion = inclusion; }

    public String getItemOrder() { return itemOrder; }
    public void setItemOrder(String itemOrder) { this.itemOrder = itemOrder; }

    public String getResultJson() { return resultJson; }
    public void setResultJson(String resultJson) { this.resultJson = resultJson; }

    public Integer getTotalCount() { return totalCount; }
    public void setTotalCount(Integer totalCount) { this.totalCount = totalCount; }

    public OffsetDateTime getCachedAt() { return cachedAt; }
    public void setCachedAt(OffsetDateTime cachedAt) { this.cachedAt = cachedAt; }

    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
}
