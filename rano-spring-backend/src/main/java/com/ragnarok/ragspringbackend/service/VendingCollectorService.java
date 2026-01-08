package com.ragnarok.ragspringbackend.service;

import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import com.ragnarok.ragspringbackend.entity.VendingListing;
import com.ragnarok.ragspringbackend.repository.VendingListingRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;

/**
 * 노점 데이터 수집 서비스
 * - 기존 크롤러 호출 → DB upsert
 * - 동시성 제한 (1-2)
 * - 쿨다운 60초
 */
@Service
public class VendingCollectorService {

    private final VendingService vendingService;  // 기존 크롤러
    private final VendingListingRepository listingRepository;
    private final ItemCacheService itemCacheService;

    // 동시성 제한: 최대 2개 동시 수집
    private final Semaphore crawlSemaphore = new Semaphore(2);

    // 쿨다운: server|keyword → 마지막 수집 시각
    private final Map<String, LocalDateTime> lastCrawlTime = new ConcurrentHashMap<>();
    private static final long COOLDOWN_SECONDS = 60;

    public VendingCollectorService(
            VendingService vendingService,
            VendingListingRepository listingRepository,
            ItemCacheService itemCacheService
    ) {
        this.vendingService = vendingService;
        this.listingRepository = listingRepository;
        this.itemCacheService = itemCacheService;
    }

    /**
     * 동기 수집 (직접 호출)
     * @return 저장된 레코드 수
     */
    @Transactional
    public int collectSync(String server, String keyword, int maxPages) {
        String cooldownKey = server + "|" + keyword;
        
        // 쿨다운 체크
        LocalDateTime lastTime = lastCrawlTime.get(cooldownKey);
        if (lastTime != null && lastTime.plusSeconds(COOLDOWN_SECONDS).isAfter(LocalDateTime.now())) {
            long remaining = COOLDOWN_SECONDS - java.time.Duration.between(lastTime, LocalDateTime.now()).getSeconds();
            System.out.println("[VendingCollector] COOLDOWN: " + cooldownKey + " remaining=" + remaining + "s");
            return 0;
        }

        // 세마포어 획득
        if (!crawlSemaphore.tryAcquire()) {
            System.out.println("[VendingCollector] BUSY: max concurrent crawls reached");
            return 0;
        }

        try {
            long start = System.currentTimeMillis();
            int totalSaved = 0;

            for (int page = 1; page <= maxPages; page++) {
                try {
                    // 기존 크롤러 호출
                    VendingPageResponse<VendingItemDto> response = vendingService.searchVendingByItemDirect(server, keyword, page, 10);
                    
                    if (response.getData() == null || response.getData().isEmpty()) {
                        break;
                    }

                    // DB upsert
                    for (VendingItemDto dto : response.getData()) {
                        totalSaved += upsertListing(server, dto, page);
                    }

                    // Rate limit: 페이지 간 1초 대기
                    if (page < maxPages) {
                        Thread.sleep(1000);
                    }
                } catch (Exception e) {
                    System.err.println("[VendingCollector] Page " + page + " failed: " + e.getMessage());
                    break;
                }
            }

            long elapsed = System.currentTimeMillis() - start;
            lastCrawlTime.put(cooldownKey, LocalDateTime.now());
            System.out.println("[VendingCollector] DONE: " + cooldownKey + " saved=" + totalSaved + " time=" + elapsed + "ms");
            
            return totalSaved;
        } finally {
            crawlSemaphore.release();
        }
    }

    /**
     * 비동기 수집 (on-demand refresh)
     */
    @Async
    public void collectAsync(String server, String keyword, int maxPages) {
        collectSync(server, keyword, maxPages);
    }

    /**
     * DB upsert (기존 레코드 업데이트 or 신규 삽입)
     */
    private int upsertListing(String server, VendingItemDto dto, int page) {
        if (dto.getMap_id() == null || dto.getSsi() == null) {
            return 0;  // map_id, ssi 없으면 저장 불가
        }

        String normalizedName = normalizeItemName(dto.getItem_name());
        
        // price 포함하여 조회 (UNIQUE 제약: server, map_id, ssi, item_name, price)
        Optional<VendingListing> existing = listingRepository.findByServerAndMapIdAndSsiAndItemNameAndPrice(
            server, dto.getMap_id(), dto.getSsi(), dto.getItem_name(), dto.getPrice()
        );

        VendingListing listing;
        if (existing.isPresent()) {
            listing = existing.get();
            // 업데이트
            listing.setPrice(dto.getPrice());
            listing.setAmount(dto.getQuantity());
            listing.setScrapedAt(LocalDateTime.now());
        } else {
            // 신규 생성
            listing = new VendingListing();
            listing.setServer(server);
            listing.setMapId(dto.getMap_id());
            listing.setSsi(dto.getSsi());
            listing.setItemName(dto.getItem_name());
            listing.setItemNameNormalized(normalizedName);
            listing.setPrice(dto.getPrice());
            listing.setAmount(dto.getQuantity());
            listing.setShopName(dto.getVendor_info());
            listing.setSellerName(dto.getVendor_name());
            listing.setSourcePage(page);
            
            // Item ID 매칭
            Integer itemId = itemCacheService.getIdByName(normalizedName);
            if (itemId == null) {
                itemId = itemCacheService.getIdByPrefix(normalizedName);
            }
            listing.setItemId(itemId);
        }

        listingRepository.save(listing);
        return 1;
    }

    /**
     * 아이템 이름 정규화 (검색용)
     */
    private String normalizeItemName(String itemName) {
        if (itemName == null || itemName.isEmpty()) {
            return "";
        }
        String normalized = itemName;
        normalized = normalized.replaceAll("^\\+\\d+\\s+", "");
        normalized = normalized.replaceAll("\\[(RARE|UNIQUE|LEGENDARY|EPIC)\\]\\s*", "");
        normalized = normalized.replaceAll("\\s*\\([^)]*\\)\\s*$", "");
        normalized = normalized.replaceAll("\\s*\\[\\d+\\]\\s*$", "");
        return normalized.trim();
    }
}
