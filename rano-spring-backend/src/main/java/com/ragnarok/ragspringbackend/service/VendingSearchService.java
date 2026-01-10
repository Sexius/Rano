package com.ragnarok.ragspringbackend.service;

import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import com.ragnarok.ragspringbackend.entity.VendingListing;
import com.ragnarok.ragspringbackend.repository.VendingListingRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 노점 검색 서비스 (DB Only)
 * - 외부 fetch 절대 없음
 * - vending_listings 테이블만 조회
 * - p95 < 500ms 목표
 */
@Service
public class VendingSearchService {

    private final VendingListingRepository listingRepository;
    private final VendingCollectorService collectorService;

    // 데이터 신선도 기준 (5분)
    private static final long STALE_THRESHOLD_MINUTES = 5;

    public VendingSearchService(
            VendingListingRepository listingRepository,
            VendingCollectorService collectorService
    ) {
        this.listingRepository = listingRepository;
        this.collectorService = collectorService;
    }

    /**
     * 노점 검색 (DB Only - fetch 없음)
     * @return VendingPageResponse with scraped_at, is_stale flag
     */
    public VendingSearchResponse search(String server, String keyword, int page, int size, String sortField, String sortDir) {
        long start = System.currentTimeMillis();

        // 정렬 설정 (기본: price ASC)
        Sort sort;
        if ("desc".equalsIgnoreCase(sortDir)) {
            sort = Sort.by(Sort.Direction.DESC, sortField);
        } else {
            sort = Sort.by(Sort.Direction.ASC, sortField);
        }
        PageRequest pageable = PageRequest.of(page - 1, size, sort);

        // 1차: Prefix 검색 (빠름)
        Page<VendingListing> result;
        if (server == null || server.isEmpty() || "all".equalsIgnoreCase(server)) {
            result = listingRepository.findByItemNamePrefixSorted(keyword, pageable);
        } else {
            result = listingRepository.findByServerAndItemNamePrefixSorted(server, keyword, pageable);
        }

        // 결과 변환
        List<VendingItemDto> items = result.getContent().stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        // 최신 scraped_at 조회
        Optional<LocalDateTime> latestScrapedAt = server != null && !server.isEmpty()
                ? listingRepository.findLatestScrapedAtByKeyword(server, keyword)
                : Optional.empty();

        // 신선도 체크
        boolean isStale = latestScrapedAt.isEmpty() || 
                latestScrapedAt.get().plusMinutes(STALE_THRESHOLD_MINUTES).isBefore(LocalDateTime.now());

        // On-demand refresh 트리거 (비동기, 결과 기다리지 않음)
        boolean refreshTriggered = false;
        if (isStale && server != null && !server.isEmpty()) {
            collectorService.collectAsync(server, keyword, 3);  // 최대 3페이지만
            refreshTriggered = true;
        }

        long dbTime = System.currentTimeMillis() - start;
        System.out.println("[VendingPerf] db=" + dbTime + "ms total=" + dbTime + "ms count=" + items.size() + " stale=" + isStale);

        // 응답 생성
        VendingSearchResponse response = new VendingSearchResponse();
        response.setData(items);
        response.setTotal((int) result.getTotalElements());
        response.setPage(page);
        response.setTotalPages(result.getTotalPages());
        response.setScrapedAt(latestScrapedAt.orElse(null));
        response.setStale(isStale);
        response.setRefreshTriggered(refreshTriggered);

        return response;
    }

    /**
     * Entity → DTO 변환
     */
    private VendingItemDto toDto(VendingListing listing) {
        VendingItemDto dto = new VendingItemDto();
        dto.setId(listing.getId().intValue());
        dto.setServer_name(listing.getServer());
        dto.setItem_name(listing.getItemName());
        dto.setPrice(listing.getPrice());
        dto.setQuantity(listing.getAmount());
        dto.setVendor_name(listing.getSellerName());
        dto.setVendor_info(listing.getShopName());
        dto.setMap_id(listing.getMapId());
        dto.setSsi(listing.getSsi());
        
        // 아이콘 URL 생성
        if (listing.getItemId() != null) {
            dto.setItem_icon_url("https://static.divine-pride.net/images/items/item/" + listing.getItemId() + ".png");
        }
        
        return dto;
    }

    /**
     * 검색 응답 DTO (scraped_at 포함)
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
