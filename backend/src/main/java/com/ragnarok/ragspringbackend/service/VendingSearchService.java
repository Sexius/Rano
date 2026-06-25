package com.ragnarok.ragspringbackend.service;

import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import com.ragnarok.ragspringbackend.entity.VendingListing;
import com.ragnarok.ragspringbackend.repository.VendingListingRepository;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class VendingSearchService {

    private final VendingListingRepository listingRepository;
    private final VendingCollectorService collectorService;
    private final VendingService vendingService;
    private final CacheManager cacheManager;
    private final VendingLogger logger;

    public VendingSearchService(
        VendingListingRepository listingRepository,
        VendingCollectorService collectorService,
        VendingService vendingService,
        CacheManager cacheManager,
        VendingLogger logger
    ) {
        this.listingRepository = listingRepository;
        this.collectorService = collectorService;
        this.vendingService = vendingService;
        this.cacheManager = cacheManager;
        this.logger = logger;
    }

    public VendingSearchResponse search(String server, String keyword, int page, int size, String sortField, String sortDir) {
        if (server == null || server.isEmpty()) {
            server = "baphomet";
        }
        if (keyword == null) {
            keyword = "";
        }

        String cacheKey = server.toLowerCase() + "|" + keyword;
        Cache cache = cacheManager.getCache("vendingSearch");

        // 1. Check Caffeine Cache
        if (cache != null) {
            @SuppressWarnings("unchecked")
            List<VendingItemDto> cachedList = cache.get(cacheKey, List.class);
            if (cachedList != null) {
                logger.log("CACHE_HIT", cacheKey);
                return paginate(cachedList, page, size, "hit", false, null, "Cached in memory", sortField, sortDir);
            }
        }

        // 2. Check DB Freshness and Crawl Status
        Optional<LocalDateTime> lastScraped = listingRepository.findLatestScrapedAtByKeyword(server, keyword);
        LocalDateTime lastCrawlAttempt = collectorService.getLastCrawlTime(server, keyword);
        
        LocalDateTime newestRecord = lastScraped.orElse(null);
        if (lastCrawlAttempt != null && (newestRecord == null || lastCrawlAttempt.isAfter(newestRecord))) {
            newestRecord = lastCrawlAttempt;
        }

        boolean isStale = newestRecord == null || newestRecord.plusMinutes(10).isBefore(LocalDateTime.now());

        if (isStale) {
            if (vendingService.isLiveFetchEnabled()) {
                logger.log("CACHE_MISS_TRIGGER_ASYNC", cacheKey);
                collectorService.collectAsync(server, keyword, 1, 20);
                throw new NoCacheAvailableException("CACHE_MISS", server, keyword, 10);
            } else {
                logger.log("LIVE_FETCH_DISABLED", "Blocked async crawl for " + cacheKey + ", serving DB data");
                // Do not throw 503, just fall through and load from DB (which might be empty or stale)
            }
        }

        // 3. Fresh in DB or Recently Crawled -> Load, Cache, Paginate
        logger.log("DB_LOAD", cacheKey);
        List<VendingListing> listings = listingRepository.findByServerAndItemNamePrefixSorted(server, keyword, Pageable.unpaged()).getContent();
        
        List<VendingItemDto> dtoList = listings.stream().map(this::toDto).collect(Collectors.toList());

        if (cache != null) {
            cache.put(cacheKey, dtoList);
        }

        return paginate(dtoList, page, size, "db_load", false, null, "Loaded from DB", sortField, sortDir);
    }

    private VendingItemDto toDto(VendingListing listing) {
        VendingItemDto dto = new VendingItemDto();
        dto.setId(listing.getItemId() != null ? listing.getItemId() : 0);
        dto.setVendor_name(listing.getSellerName());
        dto.setVendor_info(listing.getShopName());
        dto.setServer_name(listing.getServer());
        dto.setItem_name(listing.getItemName());
        dto.setQuantity(listing.getAmount());
        dto.setPrice(listing.getPrice());
        dto.setMap_id(listing.getMapId());
        dto.setSsi(listing.getSsi());
        
        if (listing.getItemId() != null) {
            dto.setItem_icon_url("https://static.divine-pride.net/images/items/item/" + listing.getItemId() + ".png");
        }
        return dto;
    }

    private VendingSearchResponse paginate(List<VendingItemDto> allItems, int page, int size, 
                                           String cacheStatus, boolean isStale, String reason, String message, String sortField, String sortDir) {
        
        // Sorting logic in memory
        boolean isAsc = "asc".equalsIgnoreCase(sortDir);
        List<VendingItemDto> sortedList = new ArrayList<>(allItems);
        
        if ("name".equalsIgnoreCase(sortField)) {
            sortedList.sort(isAsc ? Comparator.comparing(VendingItemDto::getItem_name) : Comparator.comparing(VendingItemDto::getItem_name).reversed());
        } else if ("amount".equalsIgnoreCase(sortField)) {
            sortedList.sort(isAsc ? Comparator.comparing(VendingItemDto::getQuantity) : Comparator.comparing(VendingItemDto::getQuantity).reversed());
        } else {
            // Default to price
            sortedList.sort(isAsc ? Comparator.comparing(VendingItemDto::getPrice) : Comparator.comparing(VendingItemDto::getPrice).reversed());
        }

        int total = sortedList.size();
        int fromIndex = Math.max((page - 1) * size, 0);
        int toIndex = Math.min(fromIndex + size, total);

        List<VendingItemDto> pageData = fromIndex >= total
            ? new ArrayList<>()
            : new ArrayList<>(sortedList.subList(fromIndex, toIndex));

        VendingSearchResponse response = new VendingSearchResponse();
        response.setData(pageData);
        response.setTotal(total);
        response.setPage(page);
        response.setSize(pageData.size());
        response.setTotalPages((int) Math.ceil((double) total / size));
        response.setScrapedAt(LocalDateTime.now());
        response.setStale(isStale);
        response.setRefreshTriggered(isStale);
        response.setReason(reason);
        response.setCacheStatus(cacheStatus);
        response.setSource(cacheStatus.equals("hit") ? "memory" : "db");
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
        public void setStale(boolean stale) { this.isStale = stale; }

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
