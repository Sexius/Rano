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
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

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
    
    // Singleflight: cacheKey별 진행 중인 GNJOY 호출 추적
    private static final ConcurrentHashMap<String, CompletableFuture<VendingSearchResponse>> inFlightRequests = new ConcurrentHashMap<>();

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
     * 노점 검색 (Cache → GNJOY fallback → Stale Cache fallback)
     */
    public VendingSearchResponse search(String server, String keyword, int page, int size, String sortField, String sortDir) {
        long start = System.currentTimeMillis();
        
        // 기본값 처리
        if (server == null || server.isEmpty()) server = "baphomet";
        if (keyword == null) keyword = "";
        
        // Cache Key 생성
        String cacheKey = buildCacheKey(server, keyword, page, size, sortField);
        
        // 1. Valid 캐시 조회 (expires_at > now)
        OffsetDateTime now = OffsetDateTime.now();
        Optional<VendingSearchCache> cached = cacheRepository.findValidCache(cacheKey, now);
        
        if (cached.isPresent()) {
            // Valid Cache Hit
            long cacheTime = System.currentTimeMillis() - start;
            System.out.println("[VendingSearch] CACHE_HIT key=" + cacheKey + " time=" + cacheTime + "ms");
            return fromCache(cached.get(), false, null);
        }
        
        // 2. Cache Miss → Singleflight GNJOY 호출
        System.out.println("[VendingSearch] CACHE_MISS key=" + cacheKey);
        
        // Singleflight 패턴: 동일 cacheKey에 대한 동시 요청 합치기
        final String finalServer = server;
        final String finalKeyword = keyword;
        final boolean[] isLeader = {false};
        
        CompletableFuture<VendingSearchResponse> future = inFlightRequests.computeIfAbsent(cacheKey, k -> {
            isLeader[0] = true;
            System.out.println("[Singleflight] LEADER key=" + k);
            return CompletableFuture.supplyAsync(() -> 
                doGnjoyFetch(k, finalServer, finalKeyword, page, size, sortField, start)
            );
        });
        
        // JOIN 요청 감지 (LEADER가 아닌 경우)
        if (!isLeader[0]) {
            System.out.println("[Singleflight] JOIN key=" + cacheKey + " (waiting for leader)");
        }
        
        try {
            VendingSearchResponse result = future.get();  // 결과 대기
            if (!isLeader[0]) {
                System.out.println("[Singleflight] JOIN_COMPLETE key=" + cacheKey);
            }
            return result;
        } catch (InterruptedException | ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof NoCacheAvailableException) {
                throw (NoCacheAvailableException) cause;
            }
            throw new RuntimeException("Singleflight error", e);
        }
    }
    
    /**
     * GNJOY 호출 실행 (Singleflight leader가 실행)
     */
    private VendingSearchResponse doGnjoyFetch(String cacheKey, String server, String keyword, 
                                                int page, int size, String sortField, long start) {
        try {
            // Double-check: 다른 스레드가 이미 갱신했을 수 있음
            Optional<VendingSearchCache> cached = cacheRepository.findValidCache(cacheKey, OffsetDateTime.now());
            if (cached.isPresent()) {
                System.out.println("[Singleflight] CACHE_HIT_AFTER_JOIN key=" + cacheKey);
                return fromCache(cached.get(), false, null);
            }
            
            // GNJOY 호출
            VendingPageResponse<VendingItemDto> gnjoyResult = vendingService.searchVendingByItemDirect(server, keyword, page, size);
            
            long gnjoyTime = System.currentTimeMillis() - start;
            int itemCount = gnjoyResult.getData() != null ? gnjoyResult.getData().size() : 0;
            System.out.println("[Singleflight] GNJOY_FETCH time=" + gnjoyTime + "ms items=" + itemCount);
            
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
            response.setRefreshTriggered(true);
            response.setReason(null);
            
            return response;
            
        } catch (Exception e) {
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            System.err.println("[Singleflight] GNJOY_ERROR: " + errorMsg);
            
            // Stale 캐시 fallback
            Optional<VendingSearchCache> staleCache = cacheRepository.findLatestCache(cacheKey);
            
            if (staleCache.isPresent()) {
                System.out.println("[Singleflight] STALE_CACHE_FALLBACK key=" + cacheKey);
                String reason = errorMsg.contains("429") ? "GNJOY_429" : "GNJOY_ERROR";
                return fromCache(staleCache.get(), true, reason);
            }
            
            // Stale 캐시도 없음 → 예외
            System.err.println("[Singleflight] NO_CACHE_AVAILABLE key=" + cacheKey);
            boolean is429 = errorMsg.contains("429");
            throw new NoCacheAvailableException(
                is429 ? "GNJOY_429_NO_CACHE" : "GNJOY_UNAVAILABLE",
                server, keyword, is429 ? 600 : 60
            );
            
        } finally {
            inFlightRequests.remove(cacheKey);
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
    private VendingSearchResponse fromCache(VendingSearchCache cache, boolean isStale, String reason) {
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
        response.setReason(reason);
        
        return response;
    }

    /**
     * 검색 응답 DTO
     */
    public static class VendingSearchResponse extends VendingPageResponse<VendingItemDto> {
        private LocalDateTime scrapedAt;
        private boolean isStale;
        private boolean refreshTriggered;
        private String reason;

        public LocalDateTime getScrapedAt() { return scrapedAt; }
        public void setScrapedAt(LocalDateTime scrapedAt) { this.scrapedAt = scrapedAt; }

        public boolean isStale() { return isStale; }
        public void setStale(boolean stale) { isStale = stale; }

        public boolean isRefreshTriggered() { return refreshTriggered; }
        public void setRefreshTriggered(boolean refreshTriggered) { this.refreshTriggered = refreshTriggered; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }
}
