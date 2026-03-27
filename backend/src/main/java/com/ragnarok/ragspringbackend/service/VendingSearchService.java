package com.ragnarok.ragspringbackend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import com.ragnarok.ragspringbackend.entity.VendingSearchCache;
import com.ragnarok.ragspringbackend.repository.VendingSearchCacheRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;

@Service
public class VendingSearchService {

    private static final long CACHE_TTL_MINUTES = 10;
    private static final ConcurrentHashMap<String, CompletableFuture<VendingSearchResponse>> inFlightRequests =
        new ConcurrentHashMap<>();

    private final VendingSearchCacheRepository cacheRepository;
    private final VendingService vendingService;
    private final ObjectMapper objectMapper;
    private final VendingLogger logger;

    public VendingSearchService(
        VendingSearchCacheRepository cacheRepository,
        VendingService vendingService,
        ObjectMapper objectMapper,
        VendingLogger logger
    ) {
        this.cacheRepository = cacheRepository;
        this.vendingService = vendingService;
        this.objectMapper = objectMapper;
        this.logger = logger;
    }

    public VendingSearchResponse search(String server, String keyword, int page, int size, String sortField, String sortDir) {
        if (server == null || server.isEmpty()) {
            server = "baphomet";
        }
        if (keyword == null) {
            keyword = "";
        }

        String cacheKey = buildCacheKey(server, keyword, page, size, sortField);
        OffsetDateTime now = OffsetDateTime.now();

        Optional<VendingSearchCache> cached = cacheRepository.findValidCache(cacheKey, now);
        if (cached.isPresent()) {
            logger.log("CACHE_HIT", cacheKey);
            return fromCache(cached.get(), "hit", false, null, "Cached search result");
        }

        if (!vendingService.isLiveFetchEnabled()) {
            logger.log("CACHE_MISS", cacheKey + " source=cache_only");
            Optional<VendingSearchCache> staleCache = cacheRepository.findLatestCache(cacheKey);
            if (staleCache.isPresent()) {
                logger.log("CACHE_STALE", cacheKey + " source=cache_only");
                return fromCache(staleCache.get(), "stale", true, "CACHE_STALE", "Serving stale cached result");
            }
            throw new NoCacheAvailableException("CACHE_MISS", server, keyword, 60);
        }

        final String finalServer = server;
        final String finalKeyword = keyword;
        final boolean[] isLeader = {false};

        CompletableFuture<VendingSearchResponse> future = inFlightRequests.computeIfAbsent(cacheKey, key -> {
            isLeader[0] = true;
            return CompletableFuture.supplyAsync(() ->
                doGnjoyFetch(key, finalServer, finalKeyword, page, size, sortField)
            );
        });

        try {
            return future.get();
        } catch (InterruptedException | ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof NoCacheAvailableException) {
                throw (NoCacheAvailableException) cause;
            }
            throw new RuntimeException("Singleflight error", e);
        }
    }

    private VendingSearchResponse doGnjoyFetch(String cacheKey, String server, String keyword, int page, int size, String sortField) {
        try {
            Optional<VendingSearchCache> cached = cacheRepository.findValidCache(cacheKey, OffsetDateTime.now());
            if (cached.isPresent()) {
                logger.log("CACHE_HIT_AFTER_JOIN", cacheKey);
                return fromCache(cached.get(), "hit", false, null, "Cached search result");
            }

            VendingPageResponse<VendingItemDto> gnjoyResult = vendingService.searchVendingByItemDirect(server, keyword, page, size);
            saveCache(cacheKey, server, keyword, page, size, sortField, gnjoyResult);

            VendingSearchResponse response = new VendingSearchResponse();
            response.setData(gnjoyResult.getData());
            response.setTotal(gnjoyResult.getTotal());
            response.setPage(page);
            response.setTotalPages(gnjoyResult.getTotalPages());
            response.setScrapedAt(LocalDateTime.now());
            response.setStale(false);
            response.setRefreshTriggered(true);
            response.setReason(null);
            response.setCacheStatus("refreshed");
            response.setSource("upstream");
            response.setMessage("Fetched from GNJOY and cached");
            return response;
        } catch (Exception e) {
            String reason = classifyFetchFailure(e);
            logger.log(reason, cacheKey);

            Optional<VendingSearchCache> staleCache = cacheRepository.findLatestCache(cacheKey);
            if (staleCache.isPresent()) {
                logger.log("CACHE_STALE", cacheKey + " reason=" + reason);
                return fromCache(staleCache.get(), "stale", true, reason, "Serving stale cached result");
            }

            throw new NoCacheAvailableException(reason, server, keyword, 60);
        } finally {
            inFlightRequests.remove(cacheKey);
        }
    }

    private String classifyFetchFailure(Throwable throwable) {
        String message = throwable.getMessage() != null ? throwable.getMessage() : throwable.getClass().getSimpleName();
        if (message.contains("403")) {
            return "UPSTREAM_HTTP_403";
        }
        if (message.contains("429")) {
            return "UPSTREAM_HTTP_429";
        }
        if (message.contains("PARSE")) {
            return "UPSTREAM_PARSE_ERROR";
        }
        if (message.contains("LIVE_FETCH_DISABLED")) {
            return "LIVE_FETCH_DISABLED";
        }
        return "UPSTREAM_ERROR";
    }

    private String buildCacheKey(String server, String keyword, int page, int size, String sortField) {
        return String.format(
            "v2|%s|%s|%d|%d|%s",
            server.toLowerCase(),
            keyword,
            page,
            size,
            sortField != null ? sortField : "price"
        );
    }

    @Transactional
    protected void saveCache(
        String cacheKey,
        String server,
        String keyword,
        int page,
        int size,
        String sortField,
        VendingPageResponse<VendingItemDto> result
    ) {
        try {
            String resultJson = objectMapper.writeValueAsString(result.getData());

            VendingSearchCache cache = cacheRepository.findByCacheKey(cacheKey).orElse(new VendingSearchCache());
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
            logger.log("CACHE_SAVED", cacheKey);
        } catch (JsonProcessingException e) {
            logger.log("CACHE_SAVE_ERROR", e.getMessage());
        }
    }

    private VendingSearchResponse fromCache(
        VendingSearchCache cache,
        String cacheStatus,
        boolean isStale,
        String reason,
        String message
    ) {
        VendingSearchResponse response = new VendingSearchResponse();

        try {
            List<VendingItemDto> items = objectMapper.readValue(
                cache.getResultJson(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, VendingItemDto.class)
            );
            response.setData(items);
        } catch (JsonProcessingException e) {
            logger.log("CACHE_PARSE_ERROR", e.getMessage());
            response.setData(List.of());
        }

        response.setTotal(cache.getTotalCount());
        response.setPage(cache.getPage());
        response.setTotalPages((int) Math.ceil((double) cache.getTotalCount() / 10));
        response.setScrapedAt(cache.getCachedAt().toLocalDateTime());
        response.setStale(isStale);
        response.setRefreshTriggered(false);
        response.setReason(reason);
        response.setCacheStatus(cacheStatus);
        response.setSource("cache_only");
        response.setMessage(message);
        return response;
    }

    public static class VendingSearchResponse extends VendingPageResponse<VendingItemDto> {
        private LocalDateTime scrapedAt;
        private boolean isStale;
        private boolean refreshTriggered;
        private String reason;
        private String cacheStatus;
        private String source;
        private String message;

        public LocalDateTime getScrapedAt() { return scrapedAt; }
        public void setScrapedAt(LocalDateTime scrapedAt) { this.scrapedAt = scrapedAt; }

        public boolean isStale() { return isStale; }
        public void setStale(boolean stale) { isStale = stale; }

        public boolean isRefreshTriggered() { return refreshTriggered; }
        public void setRefreshTriggered(boolean refreshTriggered) { this.refreshTriggered = refreshTriggered; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }

        public String getCacheStatus() { return cacheStatus; }
        public void setCacheStatus(String cacheStatus) { this.cacheStatus = cacheStatus; }

        public String getSource() { return source; }
        public void setSource(String source) { this.source = source; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}
