package com.ragnarok.ragspringbackend.controller;

import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.service.NoCacheAvailableException;
import com.ragnarok.ragspringbackend.service.VendingCollectorService;
import com.ragnarok.ragspringbackend.service.VendingLogger;
import com.ragnarok.ragspringbackend.service.VendingSearchService;
import com.ragnarok.ragspringbackend.service.VendingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class VendingController {

    private static final int DEFAULT_PAGE_SIZE = 100;
    private static final java.util.Set<String> ALLOWED_SERVERS = java.util.Set.of("baphomet", "yggdrasil", "ifrit");
    private static final int MAX_UPLOAD_ITEMS = 2000;

    private final VendingService vendingService;
    private final VendingSearchService vendingSearchService;
    private final VendingCollectorService vendingCollectorService;
    private final VendingLogger logger;

    public VendingController(
        VendingService vendingService,
        VendingSearchService vendingSearchService,
        VendingCollectorService vendingCollectorService,
        VendingLogger logger
    ) {
        this.vendingService = vendingService;
        this.vendingSearchService = vendingSearchService;
        this.vendingCollectorService = vendingCollectorService;
        this.logger = logger;
    }

    @GetMapping("/vending/debug/logs")
    public ResponseEntity<List<String>> getLogs(@RequestParam(defaultValue = "100") int count) {
        return ResponseEntity.ok(logger.getRecentLogs(count));
    }

    @GetMapping("/vending")
    public ResponseEntity<?> getVendingData(
        @RequestParam(required = false) String item,
        @RequestParam(defaultValue = "baphomet") String server,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(required = false) Integer size
    ) {
        if (item == null || item.trim().isEmpty()) {
            return ResponseEntity.ok(vendingService.getAllVendingData(server, page, size != null ? size : DEFAULT_PAGE_SIZE));
        }
        return searchV2(item, server, page, size, "price", "asc");
    }

    @GetMapping("/vending/v2/search")
    public ResponseEntity<?> searchV2(
        @RequestParam String item,
        @RequestParam(defaultValue = "baphomet") String server,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(required = false) Integer size,
        @RequestParam(defaultValue = "price") String sort,
        @RequestParam(defaultValue = "asc") String dir
    ) {
        try {
            int pageSize = (size != null && size > 0) ? size : DEFAULT_PAGE_SIZE;
            VendingSearchService.VendingSearchResponse result =
                vendingSearchService.search(server, item, page, pageSize, sort, dir);
            return ResponseEntity.ok(result);
        } catch (NoCacheAvailableException e) {
            logger.log("CACHE_MISS", "search server=" + e.getServer() + " keyword=" + e.getKeyword());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                .body(Map.of(
                    "error", "cache_miss",
                    "cacheStatus", "miss",
                    "source", "cache_only",
                    "reason", e.getReason(),
                    "message", "Data not cached yet",
                    "server", e.getServer(),
                    "keyword", e.getKeyword(),
                    "retryAfterSeconds", e.getRetryAfterSeconds()
                ));
        } catch (Exception e) {
            logger.log("SEARCH_ERROR", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "internal_error",
                    "cacheStatus", "miss",
                    "source", "cache_only",
                    "message", "Internal server error"
                ));
        }
    }

    @PostMapping("/vending/collect")
    public ResponseEntity<Map<String, Object>> triggerCollection(
        @RequestParam String keyword,
        @RequestParam(defaultValue = "baphomet") String server,
        @RequestParam(defaultValue = "1") int startPage,
        @RequestParam(defaultValue = "3") int maxPages
    ) {
        if (!vendingService.isLiveFetchEnabled()) {
            logger.log("LIVE_FETCH_DISABLED", "Blocked /api/vending/collect for server=" + server + " keyword=" + keyword);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "error", "live_fetch_disabled",
                "cacheStatus", "miss",
                "source", "cache_only",
                "message", "Render cache-only mode blocks direct GNJOY collection",
                "server", server,
                "keyword", keyword
            ));
        }

        try {
            int effectiveStartPage = Math.max(1, startPage);
            int cappedMaxPages = Math.min(maxPages, 5);
            int endPage = effectiveStartPage + cappedMaxPages - 1;
            int saved = vendingCollectorService.collectSync(server, keyword, effectiveStartPage, cappedMaxPages);
            return ResponseEntity.ok(Map.of(
                "status", "completed",
                "keyword", keyword,
                "server", server,
                "startPage", effectiveStartPage,
                "endPage", endPage,
                "savedCount", saved
            ));
        } catch (Exception e) {
            logger.log("COLLECT_ERROR", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/vending/detail")
    public ResponseEntity<?> getVendingDetail(
        @RequestParam String server,
        @RequestParam String ssi,
        @RequestParam String mapID
    ) {
        try {
            Optional<VendingItemDto> cached = vendingService.getCachedVendingDetail(server, ssi, mapID);
            if (cached.isPresent()) {
                VendingItemDto detail = cached.get();
                return ResponseEntity.ok(Map.of(
                    "vendor_name", detail.getVendor_name(),
                    "vendor_info", detail.getVendor_info(),
                    "cards_equipped", detail.getCards_equipped(),
                    "map_id", detail.getMap_id(),
                    "ssi", detail.getSsi(),
                    "cacheStatus", "hit",
                    "stale", false,
                    "source", "cache_only",
                    "message", "Cached detail result"
                ));
            }

            logger.log("CACHE_MISS", "detail server=" + server + " mapId=" + mapID + " ssi=" + ssi);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of(
                    "error", "cache_miss",
                    "cacheStatus", "miss",
                    "stale", false,
                    "source", "cache_only",
                    "reason", "DETAIL_CACHE_MISS",
                    "message", "Detail not cached yet",
                    "server", server,
                    "ssi", ssi,
                    "mapID", mapID
                ));
        } catch (Exception e) {
            logger.log("DETAIL_ERROR", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "internal_error",
                    "cacheStatus", "miss",
                    "source", "cache_only",
                    "message", "Internal server error"
                ));
        }
    }

    @PostMapping("/vending/upload")
    public ResponseEntity<Map<String, Object>> uploadVendingData(
        @RequestHeader(value = "X-API-KEY", required = false) String apiKey,
        @RequestParam String server,
        @RequestBody List<VendingItemDto> items
    ) {
        String expectedKey = System.getenv("VENDING_UPLOAD_KEY");
        if (expectedKey == null || expectedKey.isEmpty()) {
            logger.log("UPLOAD_DISABLED", "missing VENDING_UPLOAD_KEY");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "upload disabled: missing VENDING_UPLOAD_KEY"));
        }

        if (apiKey == null || !apiKey.equals(expectedKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid API key"));
        }

        if (server == null || !ALLOWED_SERVERS.contains(server.toLowerCase())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Invalid server. Allowed: baphomet, yggdrasil, ifrit"));
        }

        if (items == null || items.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "No items provided"));
        }

        if (items.size() > MAX_UPLOAD_ITEMS) {
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(Map.of("error", "Too many items. Max: " + MAX_UPLOAD_ITEMS));
        }

        try {
            int saved = vendingCollectorService.uploadBatch(server.toLowerCase(), items);
            return ResponseEntity.ok(Map.of(
                "status", "completed",
                "server", server.toLowerCase(),
                "receivedCount", items.size(),
                "savedCount", saved
            ));
        } catch (Exception e) {
            logger.log("UPLOAD_ERROR", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    @org.springframework.web.bind.annotation.GetMapping("/vending/debug-gnjoy")
    public ResponseEntity<String> debugGnjoy(@RequestParam String keyword) {
        try {
            org.jsoup.Connection.Response httpResponse = org.jsoup.Jsoup.connect("https://ro.gnjoy.com/itemdeal/itemDealList.asp")
                .userAgent("Mozilla/5.0")
                .data("svrID", "9")
                .data("itemFullName", keyword)
                .data("curpage", "1")
                .timeout(5000)
                .method(org.jsoup.Connection.Method.GET)
                .execute();
            return ResponseEntity.ok(new String(httpResponse.bodyAsBytes(), "EUC-KR"));
        } catch (Exception e) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }
}
