package com.ragnarok.ragspringbackend.controller;

import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import com.ragnarok.ragspringbackend.service.VendingService;
import com.ragnarok.ragspringbackend.service.VendingSearchService;
import com.ragnarok.ragspringbackend.service.VendingCollectorService;
import com.ragnarok.ragspringbackend.service.NoCacheAvailableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class VendingController {

    private final VendingService vendingService;
    private final VendingSearchService vendingSearchService;
    private final VendingCollectorService vendingCollectorService;
    private static final int DEFAULT_PAGE_SIZE = 100;

    public VendingController(
            VendingService vendingService,
            VendingSearchService vendingSearchService,
            VendingCollectorService vendingCollectorService
    ) {
        this.vendingService = vendingService;
        this.vendingSearchService = vendingSearchService;
        this.vendingCollectorService = vendingCollectorService;
    }

    // ========== V1: 기존 실시간 크롤링 ==========
    @GetMapping("/vending")
    public ResponseEntity<VendingPageResponse<VendingItemDto>> getVendingData(
            @RequestParam(required = false) String item,
            @RequestParam(defaultValue = "baphomet") String server,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false) Integer size) {
        try {
            int pageSize = (size != null && size > 0) ? size : DEFAULT_PAGE_SIZE;
            VendingPageResponse<VendingItemDto> result;

            if (item != null && !item.trim().isEmpty()) {
                result = vendingService.searchVendingByItem(item, server, page, pageSize);
            } else {
                result = vendingService.getAllVendingData(server, page, pageSize);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== V2: DB 캐시 기반 검색 (Cache → GNJOY fallback) ==========
    @GetMapping("/vending/v2/search")
    public ResponseEntity<?> searchV2(
            @RequestParam String item,
            @RequestParam(defaultValue = "baphomet") String server,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "price") String sort,
            @RequestParam(defaultValue = "asc") String dir) {
        try {
            int pageSize = (size != null && size > 0) ? size : DEFAULT_PAGE_SIZE;
            VendingSearchService.VendingSearchResponse result = 
                vendingSearchService.search(server, item, page, pageSize, sort, dir);
            return ResponseEntity.ok(result);
        } catch (NoCacheAvailableException e) {
            // GNJOY 에러 + 캐시 없음 → 429 반환
            System.out.println("[VendingController] NoCacheAvailable: " + e.getReason());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header("Retry-After", String.valueOf(e.getRetryAfterSeconds()))
                .body(Map.of(
                    "error", "Data temporarily unavailable",
                    "reason", e.getReason(),
                    "server", e.getServer(),
                    "keyword", e.getKeyword(),
                    "retryAfterSeconds", e.getRetryAfterSeconds()
                ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error"));
        }
    }

    // ========== 수집 트리거 (관리용) ==========
    @PostMapping("/vending/collect")
    public ResponseEntity<Map<String, Object>> triggerCollection(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "baphomet") String server,
            @RequestParam(defaultValue = "1") int startPage,
            @RequestParam(defaultValue = "3") int maxPages) {
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
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/vending/detail")
    public ResponseEntity<VendingItemDto> getVendingDetail(
            @RequestParam String server,
            @RequestParam String ssi,
            @RequestParam String mapID) {
        try {
            VendingItemDto result = vendingService.getVendingDetail(server, ssi, mapID);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== 외부 업로드 API (GitHub Actions 전용) ==========
    private static final java.util.Set<String> ALLOWED_SERVERS = java.util.Set.of("baphomet", "yggdrasil", "ifrit");
    private static final int MAX_UPLOAD_ITEMS = 2000;
    
    @PostMapping("/vending/upload")
    public ResponseEntity<Map<String, Object>> uploadVendingData(
            @RequestHeader(value = "X-API-KEY", required = false) String apiKey,
            @RequestParam String server,
            @RequestBody List<VendingItemDto> items) {
        
        // 1. API 키 검증 (환경변수 필수, fallback 없음)
        String expectedKey = System.getenv("VENDING_UPLOAD_KEY");
        if (expectedKey == null || expectedKey.isEmpty()) {
            System.out.println("[VendingUpload] DISABLED: missing VENDING_UPLOAD_KEY env var");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "upload disabled: missing VENDING_UPLOAD_KEY"));
        }
        
        if (apiKey == null || !apiKey.equals(expectedKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid API key"));
        }
        
        // 2. 서버 허용 목록 검증
        if (server == null || !ALLOWED_SERVERS.contains(server.toLowerCase())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", "Invalid server. Allowed: baphomet, yggdrasil, ifrit"));
        }
        
        // 3. 아이템 개수 제한
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
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
}
