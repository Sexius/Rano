package com.ragnarok.ragspringbackend.service;

import com.ragnarok.ragspringbackend.config.GnjoyServerIdRegistry;
import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import com.ragnarok.ragspringbackend.entity.VendingListing;
import com.ragnarok.ragspringbackend.exception.RateLimitedException;
import com.ragnarok.ragspringbackend.repository.VendingListingRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class VendingService {

    private final ItemCacheService itemCacheService;
    private final CacheManager cacheManager;
    private final VendingListingRepository listingRepository;
    private final GnjoyServerIdRegistry serverIdRegistry;
    private final VendingLogger logger;
    private final boolean liveFetchEnabled;

    public VendingService(
        ItemCacheService itemCacheService,
        CacheManager cacheManager,
        VendingListingRepository listingRepository,
        GnjoyServerIdRegistry serverIdRegistry,
        VendingLogger logger,
        @Value("${vending.live-fetch.enabled:false}") boolean liveFetchEnabled
    ) {
        this.itemCacheService = itemCacheService;
        this.cacheManager = cacheManager;
        this.listingRepository = listingRepository;
        this.serverIdRegistry = serverIdRegistry;
        this.logger = logger;
        this.liveFetchEnabled = liveFetchEnabled;
    }

    public boolean isLiveFetchEnabled() {
        return true;
    }

    public VendingPageResponse<VendingItemDto> getAllVendingData(String server, int page, int size) {
        List<VendingItemDto> allItems = getSampleVendingData(server);
        return paginateResults(allItems, page, size);
    }

    public VendingPageResponse<VendingItemDto> searchVendingByItem(String itemName, String server, int page, int size) {
        if (!isLiveFetchEnabled()) {
            logger.log("LIVE_FETCH_DISABLED", "Blocked direct vending search for server=" + server + " keyword=" + itemName);
            throw new IllegalStateException("LIVE_FETCH_DISABLED");
        }

        try {
            return scrapeItemVending(itemName, server, page, size);
        } catch (Exception e) {
            logger.log("OUTBOUND_ERROR", "Search failed: " + classifyFetchFailure(e));
            throw new RuntimeException("GNJOY_SEARCH_FAILED", e);
        }
    }

    public VendingPageResponse<VendingItemDto> searchVendingByItemDirect(String server, String keyword, int page, int size) {
        ensureLiveFetchEnabled("search", server, keyword);
        try {
            return scrapeItemVending(keyword, server, page, size);
        } catch (org.jsoup.HttpStatusException e) {
            if (e.getStatusCode() == 429) {
                logger.log("UPSTREAM_HTTP_429", "server=" + server + " keyword=" + keyword + " page=" + page);
                throw new RateLimitedException(server, keyword, page, "HTTP 429 Rate Limited");
            }
            logger.log("OUTBOUND_ERROR", "HTTP_" + e.getStatusCode() + " server=" + server + " keyword=" + keyword + " page=" + page);
            throw new RuntimeException("GNJOY_HTTP_ERROR_" + e.getStatusCode(), e);
        } catch (Exception e) {
            String reason = classifyFetchFailure(e);
            logger.log("OUTBOUND_ERROR", reason + " server=" + server + " keyword=" + keyword + " page=" + page);
            throw new RuntimeException(reason, e);
        }
    }

    public Optional<VendingItemDto> getCachedVendingDetail(String server, String ssi, String mapId) {
        String normalizedServer = normalizeServer(server);
        Optional<VendingListing> listing = listingRepository.findTopByServerAndMapIdAndSsiOrderByScrapedAtDesc(
            normalizedServer, mapId, ssi
        );

        if (listing.isEmpty()) {
            logger.log("CACHE_MISS", "detail server=" + normalizedServer + " mapId=" + mapId + " ssi=" + ssi);
            return Optional.empty();
        }

        VendingListing row = listing.get();
        VendingItemDto detail = new VendingItemDto();
        detail.setVendor_name(valueOrUnknown(row.getSellerName()));
        detail.setVendor_info(valueOrUnknown(row.getShopName()));
        detail.setSsi(row.getSsi());
        detail.setMap_id(valueOrUnknown(row.getMapId()));
        detail.setCards_equipped(List.of());
        return Optional.of(detail);
    }

    public VendingItemDto getVendingDetail(String server, String ssi, String mapId) throws IOException {
        ensureLiveFetchEnabled("detail", server, ssi + "|" + mapId);

        String url = "https://ro.gnjoy.com/itemdeal/itemDealView.asp";
        String svrId = serverIdRegistry.getServerId(server);

        Document doc = Jsoup.connect(url)
            .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
            .header("Referer", "https://ro.gnjoy.com/itemdeal/itemDealList.asp")
            .data("svrID", svrId)
            .data("mapID", mapId)
            .data("ssi", ssi)
            .data("curpage", "1")
            .timeout(5000)
            .get();

        Element shopInfoTd = doc.selectFirst("th:contains(상점 이름) + td");
        String sellerName = "Unknown";
        String shopTitle = "Unknown";

        if (shopInfoTd != null) {
            String fullText = shopInfoTd.text().trim();
            if (fullText.contains("(") && fullText.contains(")")) {
                shopTitle = fullText.substring(0, fullText.indexOf("(")).trim();
                sellerName = fullText.substring(fullText.indexOf("(") + 1, fullText.indexOf(")")).trim();
            } else {
                shopTitle = fullText;
                sellerName = fullText;
            }
        }

        String mapName = null;
        Element serverLocTd = doc.selectFirst("th:contains(서버) + td");
        if (serverLocTd != null) {
            String locHtml = serverLocTd.html();
            int openParen = locHtml.lastIndexOf("(");
            int closeParen = locHtml.lastIndexOf(")");
            if (openParen >= 0 && closeParen > openParen) {
                mapName = Jsoup.parse(locHtml.substring(openParen + 1, closeParen)).text().trim();
            }
        }

        List<String> cardsEquipped = new ArrayList<>();
        collectDetailList(doc.selectFirst("th:contains(슬롯정보) + td"), cardsEquipped, "");
        collectDetailList(doc.selectFirst("th:contains(랜덤옵션) + td"), cardsEquipped, "[옵션] ");

        VendingItemDto detail = new VendingItemDto();
        detail.setVendor_name(sellerName);
        detail.setVendor_info(shopTitle);
        detail.setSsi(ssi);
        detail.setMap_id(mapName != null ? mapName : mapId);
        detail.setCards_equipped(cardsEquipped);
        return detail;
    }

    private void collectDetailList(Element td, List<String> values, String prefix) {
        if (td == null) {
            return;
        }

        Elements liElements = td.select("li");
        if (!liElements.isEmpty()) {
            for (Element li : liElements) {
                String text = li.text().trim();
                if (!text.isEmpty() && !text.equals("-")) {
                    values.add(prefix + text);
                }
            }
            return;
        }

        String[] parts = td.html().split("<br\\s*/?>");
        for (String part : parts) {
            String text = Jsoup.parse(part).text().trim();
            if (!text.isEmpty() && !text.equals("-")) {
                values.add(prefix + text);
            }
        }
    }

    private VendingPageResponse<VendingItemDto> scrapeItemVending(String itemName, String server, int page, int size)
        throws IOException {
        long totalStart = System.currentTimeMillis();
        String url = "https://ro.gnjoy.com/itemdeal/itemDealList.asp";
        String svrId = serverIdRegistry.getServerId(server);

        org.jsoup.Connection.Response httpResponse = Jsoup.connect(url)
            .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36")
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

        Document doc = httpResponse.parse();
        Element targetTable = doc.selectFirst("table.listTypeOfDefault.dealList");
        if (targetTable == null) {
            logger.log("PARSER_ERROR", "Missing dealList table for server=" + server + " item=" + itemName + " page=" + page);
            throw new IOException("GNJOY_PARSE_ERROR_NO_TABLE");
        }

        VendingPageResponse<VendingItemDto> response = new VendingPageResponse<>();
        List<VendingItemDto> items = new ArrayList<>();
        int totalItems = 0;

        Element totalElement = doc.selectFirst("#searchResult strong");
        if (totalElement != null) {
            String totalText = totalElement.text().replaceAll("[^0-9]", "");
            if (!totalText.isEmpty()) {
                totalItems = Integer.parseInt(totalText);
            }
        }

        Elements rows = targetTable.select("tr");
        int idStart = (page - 1) * size + 1;
        boolean isFirstRow = true;

        for (Element row : rows) {
            if (isFirstRow) {
                isFirstRow = false;
                continue;
            }

            Elements columns = row.select("td");
            if (columns.size() < 5) {
                continue;
            }

            String serverName = columns.get(0).text();
            String shopName = columns.get(4).text();
            Element itemNameElement = columns.get(1);

            Element imgForName = itemNameElement.selectFirst("img");
            String itemNameText = (imgForName != null && imgForName.hasAttr("alt") && !imgForName.attr("alt").isEmpty())
                ? imgForName.attr("alt")
                : itemNameElement.text();

            String quantityText = columns.get(2).text().replaceAll("[^0-9]", "");
            int quantity = quantityText.isEmpty() ? 1 : Integer.parseInt(quantityText);

            String priceText = columns.get(3).text().replaceAll("[^0-9]", "");
            long price = priceText.isEmpty() ? 0L : Long.parseLong(priceText);

            int itemId = idStart++;
            String imageUrl = null;
            Element img = itemNameElement.selectFirst("img");
            if (img != null) {
                imageUrl = toAbsoluteImageUrl(img.attr("src"));
                String filename = img.attr("src").substring(img.attr("src").lastIndexOf('/') + 1);
                String idStr = filename.split("\\.")[0];
                if (idStr.matches("\\d+")) {
                    itemId = Integer.parseInt(idStr);
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
                    } catch (Exception ignored) {
                    }
                }
            }

            VendingItemDto item = new VendingItemDto(
                itemId, shopName, serverName, shopName, itemNameText,
                quantity, price, shopName, "Unknown", "Common", ssi, mapId
            );

            if (imageUrl != null) {
                item.setImage_url(imageUrl);
            }

            Element shopColumn = columns.get(4);
            String shopClass = shopColumn.attr("class");
            item.setShop_type(shopClass != null && shopClass.contains("buy") ? "buy" : "sell");

            Integer iconItemId = itemCacheService.getIdByName(normalizeItemName(item.getItem_name()));
            if (iconItemId == null) {
                iconItemId = itemCacheService.getIdByPrefix(normalizeItemName(item.getItem_name()));
            }
            if (iconItemId == null) {
                iconItemId = itemCacheService.getIdByContains(normalizeItemName(item.getItem_name()));
            }
            if (iconItemId != null) {
                item.setItem_icon_url("https://static.divine-pride.net/images/items/item/" + iconItemId + ".png");
            }

            items.add(item);
        }

        if (totalItems == 0 && !items.isEmpty()) {
            totalItems = items.size();
        }

        response.setData(items);
        response.setTotal(totalItems);
        response.setPage(page);
        response.setSize(items.size());
        response.setTotalPages((int) Math.ceil((double) totalItems / 10));

        long totalTime = System.currentTimeMillis() - totalStart;
        logger.log("OUTBOUND", "GNJOY success server=" + server + " item=" + itemName + " page=" + page + " count=" + items.size() + " time=" + totalTime + "ms");
        return response;
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

    private void ensureLiveFetchEnabled(String path, String server, String target) {
        if (!isLiveFetchEnabled()) {
            logger.log("LIVE_FETCH_DISABLED", "Blocked GNJOY " + path + " call for server=" + normalizeServer(server) + " target=" + target);
            throw new IllegalStateException("LIVE_FETCH_DISABLED");
        }
    }

    private String normalizeServer(String server) {
        return serverIdRegistry.normalizeServerName(server);
    }

    private String valueOrUnknown(String value) {
        return value == null || value.isBlank() ? "Unknown" : value;
    }

    private String toAbsoluteImageUrl(String src) {
        if (src == null || src.isBlank()) {
            return null;
        }
        if (src.startsWith("//")) {
            return "https:" + src;
        }
        if (src.startsWith("http")) {
            return src;
        }
        if (src.startsWith("/")) {
            return "https://ro.gnjoy.com" + src;
        }
        return src;
    }

    private String toServerDisplay(String server) {
        String normalized = normalizeServer(server);
        switch (normalized) {
            case "ifrit":
                return "ifrit";
            case "yggdrasil":
                return "yggdrasil";
            default:
                return "baphomet";
        }
    }

    private List<VendingItemDto> getSampleVendingData(String server) {
        List<VendingItemDto> results = new ArrayList<>();
        String serverDisplay = toServerDisplay(server);

        if ("baphomet".equals(serverDisplay)) {
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

        List<VendingItemDto> pageData = fromIndex >= total
            ? new ArrayList<>()
            : allItems.subList(fromIndex, toIndex);

        VendingPageResponse<VendingItemDto> response = new VendingPageResponse<>();
        response.setData(pageData);
        response.setTotal(total);
        response.setPage(page);
        response.setSize(pageData.size());
        response.setTotalPages((int) Math.ceil((double) total / size));
        return response;
    }

    private String normalizeItemName(String itemName) {
        if (itemName == null || itemName.isEmpty()) {
            return "";
        }

        String normalized = itemName;
        normalized = normalized.replaceAll("^\\+\\d+\\s+", "");
        normalized = normalized.replaceAll("\\[(RARE|UNIQUE|LEGENDARY|EPIC|COMMON|UNCOMMON)\\]\\s*", "");
        normalized = normalized.replaceAll("\\s*\\([^)]*\\)\\s*$", "");
        normalized = normalized.replaceAll("\\s*\\[\\d+\\]\\s*$", "");
        return normalized.trim();
    }
}
