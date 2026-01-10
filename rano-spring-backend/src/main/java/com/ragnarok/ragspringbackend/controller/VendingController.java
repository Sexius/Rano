package com.ragnarok.ragspringbackend.controller;

import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import com.ragnarok.ragspringbackend.service.VendingService;
import com.ragnarok.ragspringbackend.service.VendingSearchService;
import com.ragnarok.ragspringbackend.service.VendingCollectorService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    // ========== V2: DB 스냅샷 기반 검색 (fetch 없음) ==========
    @GetMapping("/vending/v2/search")
    public ResponseEntity<VendingSearchService.VendingSearchResponse> searchV2(
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
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== 수집 트리거 (관리용) ==========
    @PostMapping("/vending/collect")
    public ResponseEntity<Map<String, Object>> triggerCollection(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "baphomet") String server,
            @RequestParam(defaultValue = "3") int maxPages) {
        try {
            int saved = vendingCollectorService.collectSync(server, keyword, maxPages);
            return ResponseEntity.ok(Map.of(
                "status", "completed",
                "keyword", keyword,
                "server", server,
                "saved", saved
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
}
