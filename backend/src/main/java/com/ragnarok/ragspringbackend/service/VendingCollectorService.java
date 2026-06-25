package com.ragnarok.ragspringbackend.service;

import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import com.ragnarok.ragspringbackend.entity.VendingListing;
import com.ragnarok.ragspringbackend.exception.RateLimitedException;
import com.ragnarok.ragspringbackend.repository.VendingListingRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
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
    
    // 429 백오프 설정
    private static final long BACKOFF_MIN_MINUTES = 15;
    private static final long BACKOFF_MAX_MINUTES = 60;
    private static final int MAX_PAGES_CAP = 20;
    private final Random random = new Random();

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
     * @param startPage 시작 페이지 (1부터)
     * @param maxPages 수집할 최대 페이지 수
     * @return 저장된 레코드 수
     */
    @Transactional
    public int collectSync(String server, String keyword, int startPage, int maxPages) {
        String cooldownKey = server + "|" + keyword;
        
        // 디버그 로그 활성화: keyword에 "천공" 포함 시에만
        boolean debugLog = keyword != null && keyword.contains("천공");
        
        // startPage 최소 1
        int effectiveStartPage = Math.max(1, startPage);
        
        // maxPages cap 적용
        int cappedMaxPages = Math.min(maxPages, MAX_PAGES_CAP);
        int endPage = effectiveStartPage + cappedMaxPages - 1;
        
        System.out.println("[VendingCollector] startPage=" + effectiveStartPage 
            + " endPage=" + endPage + " cappedMaxPages=" + cappedMaxPages);
        
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
            boolean rateLimited = false;

            for (int page = effectiveStartPage; page <= endPage; page++) {
                try {
                    // 기존 크롤러 호출
                    VendingPageResponse<VendingItemDto> response = vendingService.searchVendingByItemDirect(server, keyword, page, 10);
                    
                    if (response.getData() == null || response.getData().isEmpty()) {
                        break;
                    }

                    // DB batch upsert
                    totalSaved += upsertListingsBatch(server, response.getData(), page, debugLog);

                    // Rate limit: 페이지 간 3~6초 랜덤 대기 (완만한 패턴)
                    if (page < endPage) {
                        long delay = 3000 + random.nextInt(3000); // 3000~5999ms
                        Thread.sleep(delay);
                    }
                } catch (RateLimitedException e) {
                    // 429 감지: 즉시 중단 + 백오프 쿨다운 적용
                    long backoffMinutes = BACKOFF_MIN_MINUTES 
                        + random.nextInt((int)(BACKOFF_MAX_MINUTES - BACKOFF_MIN_MINUTES + 1)); // 15~60 포함
                    LocalDateTime backoffUntil = LocalDateTime.now().plusMinutes(backoffMinutes);
                    lastCrawlTime.put(cooldownKey, backoffUntil.minusSeconds(COOLDOWN_SECONDS));
                    
                    System.out.println("[VendingCollector] 429_BLOCKED: server=" + server 
                        + " keyword=" + keyword + " page=" + page 
                        + " status=429 backoff=" + backoffMinutes + "min");
                    
                    rateLimited = true;
                    break;  // 즉시 중단
                } catch (Exception e) {
                    System.err.println("[VendingCollector] Page " + page + " failed: " + e.getMessage());
                    break;
                }
            }

            long elapsed = System.currentTimeMillis() - start;
            
            // 429 발생 시 DONE 로그/lastCrawlTime 갱신 건너뛰기
            if (!rateLimited) {
                lastCrawlTime.put(cooldownKey, LocalDateTime.now());
                System.out.println("[VendingCollector] DONE: " + cooldownKey + " saved=" + totalSaved + " time=" + elapsed + "ms");
            }
            
            return totalSaved;
        } finally {
            crawlSemaphore.release();
        }
    }

    /**
     * 비동기 수집 (on-demand refresh)
     */
    @Async
    public void collectAsync(String server, String keyword, int startPage, int maxPages) {
        collectSync(server, keyword, startPage, maxPages);
    }

    /**
     * 마지막 수집 시각 조회
     */
    public LocalDateTime getLastCrawlTime(String server, String keyword) {
        return lastCrawlTime.get(server + "|" + keyword);
    }

    /**
     * 외부 업로드 API용 배치 저장
     * @param server 서버명
     * @param items 저장할 아이템 목록
     * @return 저장된 레코드 수
     */
    @Transactional
    public int uploadBatch(String server, java.util.List<VendingItemDto> items) {
        int saved = upsertListingsBatch(server, items, 0, false);
        System.out.println("[VendingUpload] server=" + server + " received=" + items.size() + " saved=" + saved);
        return saved;
    }

    /**
     * DB 배치 upsert (N+1 방지)
     */
    private int upsertListingsBatch(String server, List<VendingItemDto> dtos, int page, boolean debugLog) {
        if (dtos == null || dtos.isEmpty()) {
            return 0;
        }

        // 1. 유효한 ssi 추출
        List<String> ssiList = dtos.stream()
                .filter(dto -> dto.getMap_id() != null && dto.getSsi() != null)
                .map(VendingItemDto::getSsi)
                .distinct()
                .toList();

        if (ssiList.isEmpty()) {
            return 0;
        }

        // 2. DB 일괄 조회
        List<VendingListing> existingListings = listingRepository.findByServerAndSsiIn(server, ssiList);
        
        // ssi 기반 맵퍼 구성 (유니크 키: ssi + itemName + price)
        Map<String, VendingListing> existingMap = new java.util.HashMap<>();
        for (VendingListing listing : existingListings) {
            String key = listing.getSsi() + "|" + listing.getItemName() + "|" + listing.getPrice();
            existingMap.put(key, listing);
        }

        List<VendingListing> toSave = new java.util.ArrayList<>();

        // 3. 삽입/수정 판단
        for (VendingItemDto dto : dtos) {
            if (dto.getMap_id() == null || dto.getSsi() == null) {
                continue;
            }

            String rawName = dto.getItem_name();
            String key = dto.getSsi() + "|" + rawName + "|" + dto.getPrice();
            
            VendingListing listing = existingMap.get(key);

            if (listing != null) {
                // Update
                listing.setPrice(dto.getPrice());
                listing.setAmount(dto.getQuantity());
                listing.setScrapedAt(LocalDateTime.now());
                if (debugLog) {
                    System.out.println("[VendingCollector] ACTION: UPDATE existing row");
                }
                toSave.add(listing);
            } else {
                // Insert
                String normalizedName = normalizeItemName(rawName);
                listing = new VendingListing();
                listing.setServer(server);
                listing.setMapId(dto.getMap_id());
                listing.setSsi(dto.getSsi());
                listing.setItemName(rawName);
                listing.setItemNameNormalized(normalizedName);
                listing.setPrice(dto.getPrice());
                listing.setAmount(dto.getQuantity());
                listing.setShopName(dto.getVendor_info());
                listing.setSellerName(dto.getVendor_name());
                listing.setSourcePage(page);

                Integer itemId = itemCacheService.getIdByName(normalizedName);
                if (itemId == null) {
                    itemId = itemCacheService.getIdByPrefix(normalizedName);
                }
                listing.setItemId(itemId);
                
                if (debugLog) {
                    System.out.println("[VendingCollector] DB_SAVE_ITEM_NAME: " + rawName);
                    System.out.println("[VendingCollector] ACTION: INSERT new row");
                }
                
                toSave.add(listing);
                // 중복 insert 방지용 맵 업데이트
                existingMap.put(key, listing);
            }
        }

        // 4. 일괄 저장
        if (!toSave.isEmpty()) {
            listingRepository.saveAll(toSave);
        }
        
        return toSave.size();
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
