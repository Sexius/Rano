package com.ragnarok.ragspringbackend.service;

import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import com.ragnarok.ragspringbackend.exception.RateLimitedException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class VendingService {

    private final ItemCacheService itemCacheService;
    private final CacheManager cacheManager;

    public VendingService(ItemCacheService itemCacheService, CacheManager cacheManager) {
        this.itemCacheService = itemCacheService;
        this.cacheManager = cacheManager;
    }

    public VendingPageResponse<VendingItemDto> getAllVendingData(String server, int page, int size) {
        List<VendingItemDto> allItems = getSampleVendingData(server);
        return paginateResults(allItems, page, size);
    }

    public VendingPageResponse<VendingItemDto> searchVendingByItem(String itemName, String server, int page, int size) {
        long startTime = System.currentTimeMillis();
        
        // Page warning (no blocking)
        if (page > 50) {
            System.out.println("[VendingPerf] page=" + page + " is high, performance may degrade");
        }
        
        // Cache key
        String cacheKey = server + "|" + itemName + "|" + page + "|" + size;
        Cache cache = cacheManager.getCache("vendingSearch");
        
        // Stale-While-Revalidate: Check cache first
        if (cache != null) {
            @SuppressWarnings("unchecked")
            VendingPageResponse<VendingItemDto> cached = cache.get(cacheKey, VendingPageResponse.class);
            if (cached != null) {
                long elapsed = System.currentTimeMillis() - startTime;
                System.out.println("[VendingPerf] cache=HIT total=" + elapsed + "ms key=" + cacheKey);
                
                // Background refresh (async) - revalidate stale data
                triggerBackgroundRefresh(itemName, server, page, size, cacheKey, cache);
                
                return cached;
            }
        }
        
        // Cache MISS - sync fetch (first request)
        try {
            VendingPageResponse<VendingItemDto> result = scrapeItemVending(itemName, server, page, size);
            
            // Store in cache
            if (cache != null) {
                cache.put(cacheKey, result);
            }
            
            return result;
        } catch (Exception e) {
            System.err.println("[VendingService] Crawl Failed. Item: " + itemName + ", Server: " + server);
            e.printStackTrace();
            VendingPageResponse<VendingItemDto> emptyResponse = new VendingPageResponse<>();
            emptyResponse.setData(new ArrayList<>());
            emptyResponse.setTotal(0);
            return emptyResponse;
        }
    }

    /**
     * Stale-While-Revalidate: Background refresh
     * Triggers async crawl to update cache while serving stale data
     */
    private void triggerBackgroundRefresh(String itemName, String server, int page, int size, String cacheKey, Cache cache) {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                long start = System.currentTimeMillis();
                VendingPageResponse<VendingItemDto> fresh = scrapeItemVending(itemName, server, page, size);
                cache.put(cacheKey, fresh);
                long elapsed = System.currentTimeMillis() - start;
                System.out.println("[VendingPerf] cache=REVALIDATE key=" + cacheKey + " time=" + elapsed + "ms");
            } catch (Exception e) {
                System.err.println("[VendingService] Background refresh failed: " + e.getMessage());
            }
        });
    }

    /**
     * 직접 크롤링 (수집 서비스용 - 캐시 우회)
     * VendingCollectorService에서 DB 적재용으로 호출
     * @throws RateLimitedException 429 발생 시
     */
    public VendingPageResponse<VendingItemDto> searchVendingByItemDirect(String server, String keyword, int page, int size) {
        try {
            return scrapeItemVending(keyword, server, page, size);
        } catch (org.jsoup.HttpStatusException e) {
            if (e.getStatusCode() == 429) {
                System.err.println("[VendingService] 429 Rate Limited: status=429 server=" + server + " keyword=" + keyword + " page=" + page);
                throw new RateLimitedException(server, keyword, page, "HTTP 429 Rate Limited");
            }
            System.err.println("[VendingService] Direct crawl failed: " + e.getMessage());
            VendingPageResponse<VendingItemDto> empty = new VendingPageResponse<>();
            empty.setData(new ArrayList<>());
            empty.setTotal(0);
            return empty;
        } catch (Exception e) {
            System.err.println("[VendingService] Direct crawl failed: " + e.getMessage());
            VendingPageResponse<VendingItemDto> empty = new VendingPageResponse<>();
            empty.setData(new ArrayList<>());
            empty.setTotal(0);
            return empty;
        }
    }

    private VendingPageResponse<VendingItemDto> scrapeItemVending(String itemName, String server, int page, int size)
            throws IOException {
        // ========== PERFORMANCE TIMING ==========
        long totalStart = System.currentTimeMillis();
        long fetchTime = 0, parseTime = 0, dbTime = 0, buildTime = 0;
        int httpStatus = 0;
        int contentLength = 0;
        
        VendingPageResponse<VendingItemDto> response = new VendingPageResponse<>();
        List<VendingItemDto> items = new ArrayList<>();
        int totalItems = 0;

        // ========== STAGE COUNTERS FOR QUANTITATIVE ANALYSIS ==========
        int stage1_htmlChars = 0;
        int stage1_rawRowCount = 0;
        int stage2_parseSuccess = 0;
        int stage2_parseFail = 0;
        int stage3_preFilterCount = 0;
        int stage4_matchesQueryPass = 0;
        int stage4_matchesQueryFail = 0;
        List<String> stage4_failedItems = new ArrayList<>();
        // ================================================================

        String svrId = "1"; // Default to Baphomet
        if ("ifrit".equalsIgnoreCase(server) || "이프리트".equals(server)) {
            svrId = "729";
        } else if ("baphomet".equalsIgnoreCase(server) || "바포메트".equals(server)) {
            svrId = "1";
        }

        // Correct endpoint: itemDealList.asp (per Chromium DevTools Ground Truth)
        String url = "https://ro.gnjoy.com/itemdeal/itemDealList.asp";

        // ========== FETCH TIMING ==========
        long fetchStart = System.currentTimeMillis();
        org.jsoup.Connection.Response httpResponse = Jsoup.connect(url)
                .userAgent(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .header("Referer", "https://ro.gnjoy.com/")
                .header("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
                .data("svrID", svrId)
                .data("itemFullName", itemName)
                .data("itemOrder", "")
                .data("inclusion", "")
                .data("curpage", String.valueOf(page))
                .timeout(15000)
                .method(org.jsoup.Connection.Method.GET)
                .execute();
        
        httpStatus = httpResponse.statusCode();
        String body = httpResponse.body();
        contentLength = body != null ? body.length() : 0;
        Document doc = httpResponse.parse();
        fetchTime = System.currentTimeMillis() - fetchStart;

        // ========== PARSE TIMING ==========
        long parseStart = System.currentTimeMillis();
        
        // STAGE 1: Raw HTML Stats
        stage1_htmlChars = doc.outerHtml().length();

        // Parse Total from source site
        Element totalElement = doc.selectFirst("#searchResult strong");
        if (totalElement != null) {
            String totalText = totalElement.text().replaceAll("[^0-9]", "");
            if (!totalText.isEmpty()) {
                totalItems = Integer.parseInt(totalText);
            }
        }
        System.out.println("[STAGE 1] Source Site Total (from HTML): " + totalItems);

        Elements tables = doc.select("table.listTypeOfDefault.dealList");
        Element targetTable = tables.isEmpty() ? null : tables.first();
        Elements rows = (targetTable != null) ? targetTable.select("tr") : new Elements();
        stage1_rawRowCount = rows.size() - 1; // Exclude header
        System.out.println("[STAGE 1] Raw Row Count (excl header): " + stage1_rawRowCount);

        int idStart = (page - 1) * size + 1;
        boolean isFirstRow = true;

        for (Element row : rows) {
            if (isFirstRow) {
                isFirstRow = false;
                continue;
            }

            Elements columns = row.select("td");
            if (columns.size() >= 5) {
                String serverName = columns.get(0).text();
                String shopName = columns.get(4).text();
                Element itemNameElement = columns.get(1);

                Element imgForName = itemNameElement.selectFirst("img");
                String itemNameText;
                if (imgForName != null && imgForName.hasAttr("alt") && !imgForName.attr("alt").isEmpty()) {
                    itemNameText = imgForName.attr("alt");
                } else {
                    itemNameText = itemNameElement.text();
                }

                // Skip header rows
                if (serverName.contains("상인명") || itemNameText.contains("아이템명")) {
                    stage2_parseFail++;
                    continue;
                }

                stage2_parseSuccess++;

                String quantityText = columns.get(2).text().replaceAll("[^0-9]", "");
                int quantity = quantityText.isEmpty() ? 1 : Integer.parseInt(quantityText);

                String priceText = columns.get(3).text().replaceAll("[^0-9]", "");
                long price = 0L;
                try {
                    if (!priceText.isEmpty()) {
                        price = Long.parseLong(priceText);
                    }
                } catch (NumberFormatException e) {
                }

                int itemId = idStart++;
                String imageUrl = null;
                Element img = itemNameElement.selectFirst("img");
                if (img != null) {
                    try {
                        String src = img.attr("src");
                        if (src.startsWith("//")) {
                            imageUrl = "https:" + src;
                        } else if (src.startsWith("http")) {
                            imageUrl = src;
                        } else if (src.startsWith("/")) {
                            imageUrl = "https://ro.gnjoy.com" + src;
                        }
                        String filename = src.substring(src.lastIndexOf('/') + 1);
                        String idStr = filename.split("\\.")[0];
                        if (idStr.matches("\\d+")) {
                            itemId = Integer.parseInt(idStr);
                        }
                    } catch (Exception e) {
                    }
                }

                String ssi = null;
                String mapId = null;
                Element link = itemNameElement.selectFirst("a");
                if (link != null) {
                    String onclick = link.attr("onclick");
                    if (onclick != null && onclick.contains("CallItemDealView")) {
                        try {
                            String cleanOnclick = onclick.substring(onclick.indexOf("(") + 1, onclick.indexOf(")"));
                            String[] params = cleanOnclick.split(",");
                            if (params.length >= 3) {
                                mapId = params[1].trim().replace("'", "");
                                ssi = params[2].trim().replace("'", "");
                            }
                        } catch (Exception e) {
                        }
                    }
                }

                VendingItemDto item = new VendingItemDto(
                        itemId, shopName, serverName, shopName, itemNameText,
                        quantity, price, shopName, "Unknown", "Common", ssi, mapId);

                if (imageUrl != null) {
                    item.setImage_url(imageUrl);
                }
                
                // 6번째 컬럼에서 구매/판매 구분 파싱
                String shopType = "sell"; // 기본값
                if (columns.size() >= 6) {
                    String typeText = columns.get(5).text();
                    if (typeText.contains("구매")) {
                        shopType = "buy";
                    }
                }
                item.setShop_type(shopType);

                stage3_preFilterCount++;

                // matchesQuery check - currently bypassed, will restore in next PR
                boolean matches = matchesQuery(itemNameText, itemName);
                if (matches) {
                    stage4_matchesQueryPass++;
                } else {
                    stage4_matchesQueryFail++;
                }

                // BYPASS: Add all items (matchesQuery filter disabled)
                items.add(item);
            } else {
                stage2_parseFail++;
            }
        }

        // End parse timing
        parseTime = System.currentTimeMillis() - parseStart;

        // ========== MEMORY LOOKUP (NO DB) ==========
        long dbStart = System.currentTimeMillis();
        
        int iconMatched = 0;
        int iconMissed = 0;
        for (VendingItemDto item : items) {
            String normalized = normalizeItemName(item.getItem_name());
            if (normalized.isEmpty()) {
                iconMissed++;
                continue;
            }
            
            // 1차: 정확 매칭 (O(1))
            Integer itemId = itemCacheService.getIdByName(normalized);
            
            // 2차: prefix 매칭
            if (itemId == null) {
                itemId = itemCacheService.getIdByPrefix(normalized);
            }
            
            // 3차: contains 매칭 (마지막 수단)
            if (itemId == null) {
                itemId = itemCacheService.getIdByContains(normalized);
            }
            
            if (itemId != null) {
                item.setItem_icon_url("https://static.divine-pride.net/images/items/item/" + itemId + ".png");
                iconMatched++;
            } else {
                iconMissed++;
            }
        }
        
        dbTime = System.currentTimeMillis() - dbStart;

        // ========== BUILD TIMING ==========
        long buildStart = System.currentTimeMillis();

        if (totalItems == 0 && !items.isEmpty()) {
            totalItems = items.size();
        }

        response.setData(items);
        response.setTotal(totalItems);
        response.setPage(page);
        response.setSize(items.size());

        // GNJOY는 페이지 당 10개 고정 (size 파라미터 무시)
        int GNJOY_PAGE_SIZE = 10;
        response.setTotalPages((int) Math.ceil((double) totalItems / GNJOY_PAGE_SIZE));

        buildTime = System.currentTimeMillis() - buildStart;
        long totalTime = System.currentTimeMillis() - totalStart;

        // ========== FINAL PERFORMANCE LOG ==========
        System.out.println("[VendingPerf] cache=MISS fetch=" + fetchTime + "ms parse=" + parseTime + "ms db=" + dbTime + "ms build=" + buildTime + "ms total=" + totalTime + "ms (http=" + httpStatus + " len=" + contentLength + ")");

        return response;
    }

    public VendingItemDto getVendingDetail(String server, String ssi, String mapId) throws IOException {
        String svrId = ("ifrit".equalsIgnoreCase(server) || "이프리트".equals(server)) ? "729" : "129";
        String url = "https://ro.gnjoy.com/itemdeal/itemDealView.asp";

        Document doc = Jsoup.connect(url)
                .userAgent(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .header("Referer", "https://ro.gnjoy.com/itemdeal/itemDealList.asp")
                .data("svrID", svrId)
                .data("mapID", mapId)
                .data("ssi", ssi)
                .data("curpage", "1")
                .timeout(5000)
                .get();

        // Seller name is located in a table: <th>노점 이름<br>(판매캐릭터명)</th> <td>Shop Title
        // (Character Name)</td>
        Element shopInfoTd = doc.selectFirst("th:contains(노점 이름) + td");
        String sellerName = "Unknown";
        String shopTitle = "Unknown";

        if (shopInfoTd != null) {
            String fullText = shopInfoTd.text().trim(); // e.g., "알아서 팔아요 (상인창고요)"
            if (fullText.contains("(") && fullText.contains(")")) {
                shopTitle = fullText.substring(0, fullText.indexOf("(")).trim();
                sellerName = fullText.substring(fullText.indexOf("(") + 1, fullText.indexOf(")")).trim();
            } else {
                shopTitle = fullText;
                sellerName = fullText;
            }
        }

        // Parse slot info (cards/enchants)
        // HTML structure: <th>슬롯정보</th> <td><ul><li>카드1</li><li>카드2</li></ul></td>
        // Or fallback: <th>슬롯정보</th> <td>카드1<br>카드2</td>
        List<String> cardsEquipped = new ArrayList<>();
        Element slotInfoTd = doc.selectFirst("th:contains(슬롯정보) + td");
        if (slotInfoTd != null) {
            // First try: Look for li elements (new structure)
            Elements liElements = slotInfoTd.select("li");
            if (!liElements.isEmpty()) {
                for (Element li : liElements) {
                    String cardName = li.text().trim();
                    if (!cardName.isEmpty() && !cardName.equals("-")) {
                        cardsEquipped.add(cardName);
                    }
                }
            } else {
                // Fallback: Split by br tags (old structure)
                String html = slotInfoTd.html();
                String[] parts = html.split("<br\\s*/?>");
                for (String part : parts) {
                    String cardName = Jsoup.parse(part).text().trim();
                    if (!cardName.isEmpty() && !cardName.equals("-")) {
                        cardsEquipped.add(cardName);
                    }
                }
            }
        }

        // Also check for 랜덤옵션 (random options/enchants)
        Element randomOptTd = doc.selectFirst("th:contains(랜덤옵션) + td");
        if (randomOptTd != null) {
            // First try: Look for li elements
            Elements liElements = randomOptTd.select("li");
            if (!liElements.isEmpty()) {
                for (Element li : liElements) {
                    String optName = li.text().trim();
                    if (!optName.isEmpty() && !optName.equals("-")) {
                        cardsEquipped.add("[옵션] " + optName);
                    }
                }
            } else {
                // Fallback: Split by br tags
                String html = randomOptTd.html();
                String[] parts = html.split("<br\\s*/?>");
                for (String part : parts) {
                    String optName = Jsoup.parse(part).text().trim();
                    if (!optName.isEmpty() && !optName.equals("-")) {
                        cardsEquipped.add("[옵션] " + optName);
                    }
                }
            }
        }

        VendingItemDto detail = new VendingItemDto();
        detail.setVendor_name(sellerName); // Character name
        detail.setVendor_info(shopTitle); // Shop title
        detail.setSsi(ssi);
        detail.setMap_id(mapId);
        detail.setCards_equipped(cardsEquipped);

        return detail;
    }

    private String toServerDisplay(String server) {
        if ("baphomet".equalsIgnoreCase(server) || "바포메트".equals(server)) {
            return "바포메트";
        } else if ("ifrit".equalsIgnoreCase(server) || "이프리트".equals(server)) {
            return "이프리트";
        } else {
            return server;
        }
    }

    private List<VendingItemDto> getSampleVendingData(String server) {
        List<VendingItemDto> results = new ArrayList<>();
        String serverDisplay = toServerDisplay(server);

        boolean isIfrit = "ifrit".equalsIgnoreCase(server) || "이프리트".equals(server);
        boolean isBaphomet = !isIfrit;

        if (isBaphomet) {
            results.add(new VendingItemDto(1, "KnightMaster", serverDisplay, "156, 187", "Excalibur [2]", 1, 15000000L,
                    "KnightMaster", "Weapon", "Legendary"));
            results.add(new VendingItemDto(2, "CardCollector", serverDisplay, "145, 203", "Ghostring Card", 1,
                    12000000L, "CardCollector", "Card", "Rare"));
            results.add(new VendingItemDto(3, "RareCards", serverDisplay, "162, 195", "Angeling Card", 1, 9800000L,
                    "RareCards", "Card", "Epic"));
            for (int i = 4; i <= 15; i++) {
                results.add(new VendingItemDto(i, "Bot_" + i, serverDisplay, "100, 100", "Red Potion", 100, 500L,
                        "Bot_" + i, "Consumable", "Common"));
            }
        } else {
            results.add(new VendingItemDto(1, "ArmorDealer", serverDisplay, "120, 138", "Valkyrie Armor", 1, 8500000L,
                    "ArmorDealer", "Armor", "Epic"));
            results.add(new VendingItemDto(2, "MagicShop", serverDisplay, "95, 165", "Staff of Magic", 1, 12000000L,
                    "MagicShop", "Weapon", "Rare"));
        }

        return results;
    }

    private VendingPageResponse<VendingItemDto> paginateResults(List<VendingItemDto> allItems, int page, int size) {
        int total = allItems.size();
        int fromIndex = Math.max((page - 1) * size, 0);
        int toIndex = Math.min(fromIndex + size, total);

        List<VendingItemDto> pageData;
        if (fromIndex >= total) {
            pageData = new ArrayList<>();
        } else {
            pageData = allItems.subList(fromIndex, toIndex);
        }

        VendingPageResponse<VendingItemDto> response = new VendingPageResponse<>();
        response.setData(pageData);
        response.setTotal(total);
        response.setPage(page);
        response.setSize(pageData.size());
        response.setTotalPages((int) Math.ceil((double) total / size));

        return response;
    }

    private boolean matchesQuery(String itemName, String query) {
        if (query == null || query.isEmpty())
            return true;

        String regex = query.replace("\\", "\\\\")
                .replace(".", "\\.")
                .replace("^", "\\^")
                .replace("$", "\\$")
                .replace("[", "\\[")
                .replace("]", "\\]")
                .replace("(", "\\(")
                .replace(")", "\\)")
                .replace("+", "\\+")
                .replace("|", "\\|")
                .replace("?", "\\?")
                .replace("*", "\\*")
                .replace("{", "\\{")
                .replace("}", "\\}");

        regex = regex.replace("%", ".*");
        regex = "(?i).*" + regex + ".*";

        boolean matches = itemName.matches(regex);
        if (!matches && itemName.contains("천공")) { // Debug specific case
            System.out.println("[DEBUG_FILTER] Filtering OUT: '" + itemName + "' against query: '" + query
                    + "' (Regex: " + regex + ")");
        }

        return matches;
    }

    /**
     * 노점 아이템 이름 정규화
     * - 제련 접두사 제거: "+10 ", "+15 " 등
     * - 희귀도 태그 제거: [RARE], [UNIQUE], [LEGENDARY] 등
     * - 괄호 내용 제거: (카드명), (옵션) 등
     * - 대괄호 내용 제거: [2], [4] 슬롯 표시 등
     * - 앞뒤 공백 정리
     */
    private String normalizeItemName(String itemName) {
        if (itemName == null || itemName.isEmpty()) {
            return "";
        }
        
        String normalized = itemName;
        
        // 1. 제련 접두사 제거: "+숫자 " 패턴
        normalized = normalized.replaceAll("^\\+\\d+\\s+", "");
        
        // 2. 희귀도 태그 제거: [RARE], [UNIQUE], [LEGENDARY], [EPIC] 등
        normalized = normalized.replaceAll("\\[(RARE|UNIQUE|LEGENDARY|EPIC|COMMON|UNCOMMON)\\]\\s*", "");
        
        // 3. 괄호 내용 제거: (카드명), (옵션 설명) 등 - 맨 끝에 있는 경우
        normalized = normalized.replaceAll("\\s*\\([^)]*\\)\\s*$", "");
        
        // 4. 대괄호 슬롯 표시 제거: [2], [4] 등 - 맨 끝에 있는 경우
        normalized = normalized.replaceAll("\\s*\\[\\d+\\]\\s*$", "");
        
        // 5. 앞뒤 공백 정리
        normalized = normalized.trim();
        
        return normalized;
    }
}
