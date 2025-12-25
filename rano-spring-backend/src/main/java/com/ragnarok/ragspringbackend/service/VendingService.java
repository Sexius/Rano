package com.ragnarok.ragspringbackend.service;

import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import org.springframework.cache.annotation.Cacheable;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class VendingService {

    public VendingPageResponse<VendingItemDto> getAllVendingData(String server, int page, int size) {
        List<VendingItemDto> allItems = getSampleVendingData(server);
        return paginateResults(allItems, page, size);
    }

    @Cacheable(value = "vendingSearch", key = "#itemName + #server + #page + #size")
    public VendingPageResponse<VendingItemDto> searchVendingByItem(String itemName, String server, int page, int size) {
        System.out.println("[VendingService] SEARCH REQUEST RECEIVED: " + itemName);
        try {
            return scrapeItemVending(itemName, server, page, size);
        } catch (Exception e) {
            System.err.println("[VendingService] Crawl Failed. Item: " + itemName + ", Server: " + server);
            e.printStackTrace();
            VendingPageResponse<VendingItemDto> emptyResponse = new VendingPageResponse<>();
            emptyResponse.setData(new ArrayList<>());
            emptyResponse.setTotal(0);
            return emptyResponse;
        }
    }

    private VendingPageResponse<VendingItemDto> scrapeItemVending(String itemName, String server, int page, int size)
            throws IOException {
        VendingPageResponse<VendingItemDto> response = new VendingPageResponse<>();
        List<VendingItemDto> items = new ArrayList<>();
        int totalItems = 0;

        String svrId = ("ifrit".equalsIgnoreCase(server) || "이프리트".equals(server)) ? "729" : "129";
        String url = "https://ro.gnjoy.com/itemDeal/itemDealList.asp";

        System.out.println(
                "[VendingService] Connecting to URL: " + url + " with item: " + itemName + ", server: " + svrId);

        Document doc = Jsoup.connect(url)
                .userAgent(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                .header("Referer", "https://ro.gnjoy.com/")
                .header("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
                .data("itemFullName", itemName)
                .data("curpage", String.valueOf(page))
                .data("svrID", svrId)
                .timeout(10000)
                .get();

        // Parse Total Count specifically from the strong tag inside #searchResult
        Element totalElement = doc.selectFirst("#searchResult strong");
        if (totalElement != null) {
            String totalText = totalElement.text().replaceAll("[^0-9]", "");
            if (!totalText.isEmpty()) {
                totalItems = Integer.parseInt(totalText);
            }
        }

        // If specific strong tag fails, try the parent p tag
        if (totalItems == 0) {
            Element totalP = doc.selectFirst("#searchResult");
            if (totalP != null) {
                String totalText = totalP.text().replaceAll("[^0-9]", "");
                if (!totalText.isEmpty()) {
                    try {
                        totalItems = Integer.parseInt(totalText);
                    } catch (NumberFormatException e) {
                        // ignore
                    }
                }
            }
        }

        Elements tables = doc.select("table.dealList");
        Element targetTable = null;

        System.out.println("[VendingService] Candidate tables for '" + itemName + "': " + tables.size());

        // First pass: Look for table with "Search Results" caption
        for (Element tbl : tables) {
            String caption = tbl.select("caption").text();
            if (caption.contains("검색결과")) {
                targetTable = tbl;
                System.out.println("[VendingService] Found target table by CAPTION: " + caption);
                break;
            }
        }

        // Second pass: If not found, look for table with correct Headers (fallback)
        if (targetTable == null) {
            for (Element tbl : tables) {
                if (!tbl.select("th.server").isEmpty() && !tbl.select("th.item").isEmpty()) {
                    targetTable = tbl;
                    System.out.println("[VendingService] Found target table by HEADERS (Caption mismatch or missing).");
                    break;
                }
            }
        }

        // Fallback if no specific table found (or only one table exists)
        if (targetTable == null && !tables.isEmpty()) {
            System.out.println("[VendingService] No specific table matched, using first one.");
            targetTable = tables.first();
        }

        Elements rows = (targetTable != null) ? targetTable.select("tbody tr") : new Elements();
        int idStart = (page - 1) * size + 1;

        System.out.println("[VendingService] Searching for: " + itemName + " | Tables found: " + tables.size()
                + " | Final Rows mapped: " + rows.size());

        for (Element row : rows) {
            Elements columns = row.select("td");
            // Vending table usually has 5 columns: Server, Item, Qty, Price, ShopName
            if (columns.size() == 5) {
                String serverName = columns.get(0).text();
                // Column 4 is "Shop Name" (Vendor title)
                String shopName = columns.get(4).text();

                Element itemNameElement = columns.get(1);
                String itemNameText = itemNameElement.text();

                // Skip header rows if they get caught
                if (serverName.contains("상인명") || itemNameText.contains("아이템명"))
                    continue;

                String quantityText = columns.get(2).text().replaceAll("[^0-9]", "");
                int quantity = quantityText.isEmpty() ? 1 : Integer.parseInt(quantityText);

                String priceText = columns.get(3).text().replaceAll("[^0-9]", "");
                long price = 0L;
                try {
                    if (!priceText.isEmpty()) {
                        price = Long.parseLong(priceText);
                    }
                } catch (NumberFormatException e) {
                    // 0
                }

                int itemId = idStart++;
                String imageUrl = null;
                Element img = itemNameElement.selectFirst("img");
                if (img != null) {
                    try {
                        String src = img.attr("src");
                        // Make sure src is absolute URL
                        if (src.startsWith("//")) {
                            imageUrl = "https:" + src;
                        } else if (src.startsWith("http")) {
                            imageUrl = src;
                        } else if (src.startsWith("/")) {
                            imageUrl = "https://ro.gnjoy.com" + src;
                        }

                        // src format: https://.../909.png
                        String filename = src.substring(src.lastIndexOf('/') + 1);
                        String idStr = filename.split("\\.")[0]; // Take part before .png/.gif
                        if (idStr.matches("\\d+")) {
                            itemId = Integer.parseInt(idStr);
                        }
                    } catch (Exception e) {
                        // Ignore
                    }
                }

                String ssi = null;
                String mapId = null;
                if (itemNameElement != null) {
                    Element link = itemNameElement.selectFirst("a");
                    if (link != null) {
                        String onclick = link.attr("onclick");
                        // CallItemDealView('129','2023','7587803212992928559',1)
                        if (onclick != null && onclick.contains("CallItemDealView")) {
                            try {
                                String cleanOnclick = onclick.substring(onclick.indexOf("(") + 1, onclick.indexOf(")"));
                                String[] params = cleanOnclick.split(",");
                                if (params.length >= 3) {
                                    // Index 0: svrId, 1: mapId, 2: ssi
                                    mapId = params[1].trim().replace("'", "");
                                    ssi = params[2].trim().replace("'", "");
                                }
                            } catch (Exception e) {
                                System.err.println("[VendingService] Failed to extract IDs from onclick: " + onclick);
                            }
                        }
                    }
                }

                VendingItemDto item = new VendingItemDto(
                        itemId, shopName, serverName, shopName, itemNameText,
                        quantity, price, shopName, "Unknown", "Common", ssi, mapId);

                // Set image URL
                if (imageUrl != null) {
                    item.setImage_url(imageUrl);
                }

                // Client-side filtering
                if (matchesQuery(itemNameText, itemName)) {
                    System.out.println("[VendingService] ADDING item: " + itemNameText + " [Query: " + itemName + "]");
                    items.add(item);
                } else {
                    System.out.println("[VendingService] SKIPPING item (No Match): " + itemNameText + " [Query: "
                            + itemName + "]");
                }
            }
        }

        if (totalItems == 0 && !items.isEmpty()) {
            totalItems = items.size();
        }

        System.out.println("[VendingService] Setting data items. Size: " + items.size());
        response.setData(items);
        System.out.println("[VendingService] Response data set. getData() returns: "
                + (response.getData() != null ? response.getData().size() : "null"));

        response.setTotal(totalItems);
        response.setPage(page);
        response.setSize(items.size());

        int safeSize = size > 0 ? size : 10;
        response.setTotalPages((int) Math.ceil((double) totalItems / safeSize));

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

        VendingItemDto detail = new VendingItemDto();
        detail.setVendor_name(sellerName); // Character name
        detail.setVendor_info(shopTitle); // Shop title
        detail.setSsi(ssi);
        detail.setMap_id(mapId);

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
}
