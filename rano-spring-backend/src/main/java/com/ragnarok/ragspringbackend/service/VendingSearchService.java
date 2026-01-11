package com.ragnarok.ragspringbackend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import com.ragnarok.ragspringbackend.entity.VendingSearchCache;
import com.ragnarok.ragspringbackend.repository.VendingSearchCacheRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 노점 검색 서비스 (Cache → GNJOY fallback)
 * - DB는 검색 결과 캐시로만 사용
 * - Source of Truth: GNJOY (ro.gnjoy.com)
 * - TTL: 10분
 */
@Service
public class VendingSearchService {

    private final VendingSearchCacheRepository cacheRepository;
    private final VendingService vendingService;
    private final ObjectMapper objectMapper;

    // TTL 설정
    private static final long CACHE_TTL_MINUTES = 10;
    
    // 동시 갱신 방지용 락
    private static final ConcurrentHashMap<String, Object> refreshLocks = new ConcurrentHashMap<>();

    public VendingSearchService(
            VendingSearchCacheRepository cacheRepository,
            VendingService vendingService,
            ObjectMapper objectMapper
    ) {
        this.cacheRepository = cacheRepository;
        this.vendingService = vendingService;
        this.objectMapper = objectMapper;
    }

    /**
     * 노점 검색 (Cache → GNJOY fallback)
     */
    public VendingSearchResponse search(String server, String keyword, int page, int size, String sortField, String sortDir) {
        long start = System.currentTimeMillis();
        
        // 기본값 처리
        if (server == null || server.isEmpty()) server = "baphomet";
        if (keyword == null) keyword = "";
        
        // Cache Key 생성
        String cacheKey = buildCacheKey(server, keyword, page, size, sortField);
        
        // 1. 캐시 조회
        OffsetDateTime now = OffsetDateTime.now();
        Optional<VendingSearchCache> cached = cacheRepository.findValidCache(cacheKey, now);
        
        if (cached.isPresent()) {
            // Cache Hit
            long cacheTime = System.currentTimeMillis() - start;
            System.out.println("[VendingSearch] CACHE_HIT key=" + cacheKey + " time=" + cacheTime + "ms");
            return fromCache(cached.get(), false);
        }
        
        // 2. Cache Miss → GNJOY 호출
        System.out.println("[VendingSearch] CACHE_MISS key=" + cacheKey);
        
        // 동시 갱신 방지
        Object lock = refreshLocks.computeIfAbsent(cacheKey, k -> new Object());
        synchronized (lock) {
            try {
                // Double-check: 다른 스레드가 이미 갱신했을 수 있음
                cached = cacheRepository.findValidCache(cacheKey, OffsetDateTime.now());
                if (cached.isPresent()) {
                    return fromCache(cached.get(), false);
                }
                
                // GNJOY 호출
                VendingPageResponse<VendingItemDto> gnjoyResult = vendingService.searchVendingByItemDirect(server, keyword, page, size);
                
                long gnjoyTime = System.currentTimeMillis() - start;
                System.out.println("[VendingSearch] GNJOY_FETCH time=" + gnjoyTime + "ms items=" + 
                    (gnjoyResult.getData() != null ? gnjoyResult.getData().size() : 0));
                
                // 캐시 저장
                saveCache(cacheKey, server, keyword, page, size, sortField, gnjoyResult);
                
                // 응답 생성
                VendingSearchResponse response = new VendingSearchResponse();
                response.setData(gnjoyResult.getData());
                response.setTotal(gnjoyResult.getTotal());
                response.setPage(page);
                response.setTotalPages(gnjoyResult.getTotalPages());
                response.setScrapedAt(LocalDateTime.now());
                response.setStale(false);
                response.setRefreshTriggered(true);  // GNJOY에서 방금 가져옴
                
                return response;
                
            } catch (Exception e) {
                System.err.println("[VendingSearch] GNJOY_ERROR: " + e.getMessage());
                e.printStackTrace();
                
                // GNJOY 실패 시 빈 응답
                VendingSearchResponse response = new VendingSearchResponse();
                response.setData(List.of());
                response.setTotal(0);
                response.setPage(page);
                response.setTotalPages(0);
                response.setStale(true);
                response.setRefreshTriggered(false);
                return response;
            } finally {
                refreshLocks.remove(cacheKey);
            }
        }
    }

    /**
     * Cache Key 생성
     */
    private String buildCacheKey(String server, String keyword, int page, int size, String sortField) {
        return String.format("%s|%s|%d|%d|%s", 
            server.toLowerCase(), 
            keyword, 
            page, 
            size, 
            sortField != null ? sortField : "price"
        );
    }

    /**
     * 캐시 저장 (Upsert)
     */
    @Transactional
    protected void saveCache(String cacheKey, String server, String keyword, int page, int size, 
                           String sortField, VendingPageResponse<VendingItemDto> result) {
        try {
            String resultJson = objectMapper.writeValueAsString(result.getData());
            
            VendingSearchCache cache = cacheRepository.findByCacheKey(cacheKey)
                .orElse(new VendingSearchCache());
            
            cache.setCacheKey(cacheKey);
            cache.setServer(server);
            cache.setKeyword(keyword);
            cache.setPage(page);
            cache.setSize(size);
            cache.setItemOrder(sortField != null ? sortField : "price");
            cache.setResultJson(resultJson);
            cache.setTotalCount(result.getTotal());
            cache.setCachedAt(OffsetDateTime.now());
            cache.setExpiresAt(OffsetDateTime.now().plusMinutes(CACHE_TTL_MINUTES));
            
            cacheRepository.save(cache);
            System.out.println("[VendingSearch] CACHE_SAVED key=" + cacheKey);
            
        } catch (JsonProcessingException e) {
            System.err.println("[VendingSearch] CACHE_SAVE_ERROR: " + e.getMessage());
        }
    }

    /**
     * 캐시에서 응답 생성
     */
    private VendingSearchResponse fromCache(VendingSearchCache cache, boolean isStale) {
        VendingSearchResponse response = new VendingSearchResponse();
        
        try {
            List<VendingItemDto> items = objectMapper.readValue(
                cache.getResultJson(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, VendingItemDto.class)
            );
            response.setData(items);
        } catch (JsonProcessingException e) {
            System.err.println("[VendingSearch] CACHE_PARSE_ERROR: " + e.getMessage());
            response.setData(List.of());
        }
        
        response.setTotal(cache.getTotalCount());
        response.setPage(cache.getPage());
        response.setTotalPages((int) Math.ceil((double) cache.getTotalCount() / cache.getSize()));
        response.setScrapedAt(cache.getCachedAt().toLocalDateTime());
        response.setStale(isStale);
        response.setRefreshTriggered(false);
        
        return response;
    }

    /**
     * 검색 응답 DTO
     */
    public static class VendingSearchResponse extends VendingPageResponse<VendingItemDto> {
        private LocalDateTime scrapedAt;
        private boolean isStale;
        private boolean refreshTriggered;

        public LocalDateTime getScrapedAt() { return scrapedAt; }
        public void setScrapedAt(LocalDateTime scrapedAt) { this.scrapedAt = scrapedAt; }

        public boolean isStale() { return isStale; }
        public void setStale(boolean stale) { isStale = stale; }

        public boolean isRefreshTriggered() { return refreshTriggered; }
        public void setRefreshTriggered(boolean refreshTriggered) { this.refreshTriggered = refreshTriggered; }
    }
}
