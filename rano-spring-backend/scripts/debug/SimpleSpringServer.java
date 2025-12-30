
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.InetSocketAddress;
import java.net.URL;
import java.net.HttpURLConnection;
import java.util.*;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

public class SimpleSpringServer {
    private static final int PORT = 8080;
    private static final String API_KEY = "403eb0a63c53841742499eeba421b8b6";

    // 캐시: 검색어_페이지 -> 결과
    private static Map<String, Map<String, Object>> vendingCache = new HashMap<>();
    private static Map<String, Long> cacheTimestamps = new HashMap<>();
    private static final long CACHE_DURATION = 300000; // 300초 = 5분

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);

        // CORS headers setup
        server.createContext("/api/search", new SearchHandler());
        server.createContext("/api/item/", new ItemHandler());
        server.createContext("/api/calculate", new CalculateHandler());
        server.createContext("/api/vending", new VendingHandler());

        server.setExecutor(null);
        server.start();
        System.out.println("Spring Boot alternative server started on port " + PORT + "!");
    }

    static class SearchHandler implements HttpHandler {
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);

            if ("OPTIONS".equals(t.getRequestMethod())) {
                t.sendResponseHeaders(200, -1);
                return;
            }

            try {
                // Proper query parsing
                Map<String, String> params = parseQuery(t.getRequestURI().getRawQuery());
                String searchQuery = params.getOrDefault("query", "");

                if (searchQuery.isEmpty()) {
                    String response = "[]";
                    t.sendResponseHeaders(200, response.length());
                    OutputStream os = t.getResponseBody();
                    os.write(response.getBytes());
                    os.close();
                    return;
                }

                // Divine Pride API call
                // Note: searchQuery is already decoded by parseQuery
                // We must encode it again for the URL, using UTF-8 as Divine Pride expects
                // UTF-8
                String url = "https://www.divine-pride.net/api/database/Item/search?query="
                        + java.net.URLEncoder.encode(searchQuery, "UTF-8") + "&apiKey=" + API_KEY;
                System.out.println("Divine Pride Search URL: " + url);

                String response = makeHttpRequest(url);

                byte[] responseBytes = response.getBytes("UTF-8");
                t.sendResponseHeaders(200, responseBytes.length);
                OutputStream os = t.getResponseBody();
                os.write(responseBytes);
                os.close();
            } catch (Exception e) {
                System.out.println("Search Handle Error: " + e.getMessage());
                // Return empty array on error to prevent UI crash
                String response = "[]";
                t.sendResponseHeaders(200, response.length());
                OutputStream os = t.getResponseBody();
                os.write(response.getBytes());
                os.close();
            }
        }
    }

    static class ItemHandler implements HttpHandler {
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);

            if ("OPTIONS".equals(t.getRequestMethod())) {
                t.sendResponseHeaders(200, -1);
                return;
            }

            try {
                String path = t.getRequestURI().getPath();
                String itemId = path.substring(path.lastIndexOf('/') + 1);

                String url = "https://www.divine-pride.net/api/database/Item/" + itemId + "?apiKey=" + API_KEY
                        + "&server=kRO";
                String response = makeHttpRequest(url);

                byte[] responseBytes = response.getBytes("UTF-8");
                t.sendResponseHeaders(200, responseBytes.length);
                OutputStream os = t.getResponseBody();
                os.write(responseBytes);
                os.close();
            } catch (Exception e) {
                System.out.println("Item Handle Error: " + e.getMessage());
                String response = "{}";
                t.sendResponseHeaders(200, response.length());
                OutputStream os = t.getResponseBody();
                os.write(response.getBytes());
                os.close();
            }
        }
    }

    static class CalculateHandler implements HttpHandler {
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);

            if ("OPTIONS".equals(t.getRequestMethod())) {
                t.sendResponseHeaders(200, -1);
                return;
            }

            try {
                InputStream is = t.getRequestBody();
                BufferedReader reader = new BufferedReader(new InputStreamReader(is));
                StringBuilder requestBody = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    requestBody.append(line);
                }
                reader.close();

                Map<String, Integer> params = parseJsonToMap(requestBody.toString());

                int baseLevel = params.getOrDefault("base_level", 1);
                int str = params.getOrDefault("str", 1);
                int dex = params.getOrDefault("dex", 1);
                int luk = params.getOrDefault("luk", 1);
                int weaponAtk = params.getOrDefault("weapon_atk", 0);
                int equipAtk = params.getOrDefault("equip_atk", 0);
                int skillPercent = params.getOrDefault("skill_percent", 100);
                int monsterDef = params.getOrDefault("monster_def", 0);

                int statusAtk = str + (baseLevel / 4) + (dex / 5) + (luk / 5);
                int totalAtk = statusAtk + weaponAtk + equipAtk;
                int modifiedAtk = totalAtk * (skillPercent / 100);
                int finalDamage = Math.max(1, modifiedAtk - monsterDef);

                String response = "{\"final_damage\":" + finalDamage + "}";
                t.sendResponseHeaders(200, response.length());
                OutputStream os = t.getResponseBody();
                os.write(response.getBytes());
                os.close();
            } catch (Exception e) {
                String response = "{\"final_damage\":0}";
                t.sendResponseHeaders(200, response.length());
                OutputStream os = t.getResponseBody();
                os.write(response.getBytes());
                os.close();
            }
        }
    }

    static class VendingHandler implements HttpHandler {
        public void handle(HttpExchange t) throws IOException {
            setCorsHeaders(t);

            if ("OPTIONS".equals(t.getRequestMethod())) {
                t.sendResponseHeaders(200, -1);
                return;
            }

            try {
                Map<String, String> params = parseQuery(t.getRequestURI().getRawQuery());
                String server = params.getOrDefault("server", "baphomet");
                String item = params.getOrDefault("item", "");
                int page = 1;
                try {
                    page = Integer.parseInt(params.getOrDefault("page", "1"));
                } catch (NumberFormatException e) {
                    page = 1;
                }

                String cacheKey = server + "_" + item + "_" + page;

                Map<String, Object> resultData;
                if (vendingCache.containsKey(cacheKey) && cacheTimestamps.containsKey(cacheKey)) {
                    long cacheAge = System.currentTimeMillis() - cacheTimestamps.get(cacheKey);
                    if (cacheAge < CACHE_DURATION) {
                        System.out.println("Using Cache (Age: " + cacheAge + "ms)");
                        resultData = vendingCache.get(cacheKey);
                    } else {
                        System.out.println("Cache expired, Re-crawling");
                        resultData = crawlVendingData(server, item, page);
                        vendingCache.put(cacheKey, resultData);
                        cacheTimestamps.put(cacheKey, System.currentTimeMillis());
                    }
                } else {
                    System.out.println("No Cache, Crawling new");
                    resultData = crawlVendingData(server, item, page);
                    vendingCache.put(cacheKey, resultData);
                    cacheTimestamps.put(cacheKey, System.currentTimeMillis());
                }

                List<Map<String, Object>> vendingData = (List<Map<String, Object>>) resultData.get("data");
                int totalItems = (int) resultData.get("total");
                int totalPages = (int) Math.ceil((double) totalItems / 10.0);

                StringBuilder json = new StringBuilder();
                json.append("{");
                json.append("\"pagination\":{");
                json.append("\"total\":").append(totalItems).append(",");
                json.append("\"page\":").append(page).append(",");
                json.append("\"size\":").append(vendingData.size()).append(",");
                json.append("\"total_pages\":").append(totalPages);
                json.append("},");
                json.append("\"data\":[");

                for (int i = 0; i < vendingData.size(); i++) {
                    Map<String, Object> item_data = vendingData.get(i);
                    json.append("{");
                    json.append("\"id\":").append(item_data.get("id")).append(",");
                    json.append("\"vendor_name\":\"").append(item_data.get("vendor_name")).append("\",");
                    json.append("\"server_name\":\"").append(item_data.get("server_name")).append("\",");
                    json.append("\"coordinates\":\"").append(item_data.get("coordinates")).append("\",");
                    json.append("\"item_name\":\"").append(item_data.get("item_name")).append("\",");
                    json.append("\"quantity\":\"").append(item_data.get("quantity")).append("\",");
                    json.append("\"price\":\"").append(item_data.get("price")).append("\",");
                    json.append("\"vendor_info\":\"").append(item_data.get("vendor_info")).append("\",");
                    json.append("\"category\":\"").append(item_data.get("category")).append("\",");
                    json.append("\"rarity\":\"").append(item_data.get("rarity")).append("\"");
                    json.append("}");
                    if (i < vendingData.size() - 1)
                        json.append(",");
                }
                json.append("]");
                json.append("}");

                String response = json.toString();
                byte[] responseBytes = response.getBytes("UTF-8");
                t.sendResponseHeaders(200, responseBytes.length);
                OutputStream os = t.getResponseBody();
                os.write(responseBytes);
                os.close();

            } catch (Exception e) {
                e.printStackTrace();
                String response = "{\"pagination\":{\"total\":0,\"page\":1,\"size\":0,\"total_pages\":0},\"data\":[]}";
                byte[] responseBytes = response.getBytes("UTF-8");
                t.sendResponseHeaders(200, responseBytes.length);
                OutputStream os = t.getResponseBody();
                os.write(responseBytes);
                os.close();
            }
        }
    }

    // Helper for robust query parsing
    private static Map<String, String> parseQuery(String rawQuery) {
        Map<String, String> params = new HashMap<>();
        if (rawQuery == null || rawQuery.isEmpty())
            return params;

        String[] pairs = rawQuery.split("&");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=", 2);
            if (keyValue.length == 2) {
                try {
                    String key = java.net.URLDecoder.decode(keyValue[0], "UTF-8");
                    String value = java.net.URLDecoder.decode(keyValue[1], "UTF-8");
                    params.put(key, value);
                } catch (Exception e) {
                    // Ignore malformed params
                }
            }
        }
        return params;
    }

    private static void setCorsHeaders(HttpExchange t) {
        t.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        t.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        t.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }

    private static String makeHttpRequest(String urlString) throws IOException {
        URL url = new URL(urlString);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("User-Agent", "Mozilla/5.0");
        // Important: Divine Pride blocks sometimes if no User-Agent

        int status = conn.getResponseCode();
        if (status >= 400) {
            // Read error stream to avoid exception loss
            InputStream err = conn.getErrorStream();
            if (err != null) {
                BufferedReader br = new BufferedReader(new InputStreamReader(err));
                StringBuilder params = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null)
                    params.append(line);
                System.out.println("Upstream Error Body: " + params.toString());
            }
            throw new IOException("Upstream returned " + status);
        }

        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), "UTF-8"));
        StringBuilder response = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            response.append(line);
        }
        reader.close();

        return response.toString();
    }

    private static Map<String, Integer> parseJsonToMap(String json) {
        Map<String, Integer> map = new HashMap<>();
        Pattern pattern = Pattern.compile("\"(\\w+)\":(\\d+)");
        Matcher matcher = pattern.matcher(json);
        while (matcher.find()) {
            String key = matcher.group(1);
            int value = Integer.parseInt(matcher.group(2));
            map.put(key, value);
        }
        return map;
    }

    private static Map<String, Object> crawlVendingData(String server, String itemName, int page) {
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> items = new ArrayList<>();
        int totalItems = 0;

        try {
            if (itemName != null && !itemName.trim().isEmpty()) {
                // Changed from itemDealList.asp to dealSearch.asp - correct endpoint
                String baseUrl = "https://ro.gnjoy.com/itemdeal/dealSearch.asp";
                String svrId = "baphomet".equals(server) ? "129" : "729";

                // IMPORTANT: ro.gnjoy.com uses Korean encoding (EUC-KR)
                String encodedItemName = java.net.URLEncoder.encode(itemName, "EUC-KR");

                // Changed from itemFullName to itemfullname (lowercase)
                String url = baseUrl + "?itemfullname=" + encodedItemName
                        + "&curpage=" + page + "&svrID=" + svrId;
                System.out.println("Crawl URL: " + url);

                Document doc = Jsoup.connect(url)
                        .userAgent("Mozilla/5.0")
                        .timeout(10000)
                        .get();

                // Parse total count
                Element totalElement = doc.selectFirst("#searchResult strong");
                if (totalElement != null) {
                    String totalText = totalElement.text().replaceAll("[^0-9]", "");
                    if (!totalText.isEmpty()) {
                        totalItems = Integer.parseInt(totalText);
                    }
                }

                Elements rows = doc.select("#divItemDealList > table > tbody > tr");
                System.out.println("Rows found: " + rows.size());

                int idStart = (page - 1) * 10 + 1;
                for (Element row : rows) {
                    Elements columns = row.select("td");
                    if (columns.size() >= 5) { // At least 5 columns
                        String vendorName = columns.get(0).text();

                        // Extract item name from img alt attribute (full name) instead of span
                        // (truncated)
                        Element itemColumn = columns.get(1);
                        Element imgElement = itemColumn.selectFirst("img");
                        String itemNameText;
                        if (imgElement != null && imgElement.hasAttr("alt") && !imgElement.attr("alt").isEmpty()) {
                            // Use img alt for full item name
                            itemNameText = imgElement.attr("alt");
                        } else {
                            // Fallback to span text (may be truncated)
                            itemNameText = itemColumn.text();
                        }

                        String quantity = columns.get(2).text();
                        String price = columns.get(3).text().replace(",", "").replace(" ", "");
                        String location = columns.get(4).text();
                        String serverDisplay = "baphomet".equals(server) ? "바포메트" : "이프리트";

                        Map<String, Object> item = new HashMap<>();
                        item.put("id", idStart++);
                        item.put("vendor_name", vendorName);
                        item.put("server_name", serverDisplay);
                        item.put("coordinates", location);
                        item.put("item_name", itemNameText);
                        item.put("quantity", quantity);
                        item.put("price", price);
                        item.put("vendor_info", location);
                        item.put("category", "Unknown");
                        item.put("rarity", "Common");

                        items.add(item);
                    }
                }
            }

            // Fallback to sample logic ONLY if strictly no items found AND empty query (or
            // other condition)
            // But if user searches '천공', we should either return empty or items.
            // If items is empty at this point, it means no results found on website.
            if (items.isEmpty() && totalItems == 0) {
                System.out.println("Crawling returned 0 items.");
            }

        } catch (Exception e) {
            System.out.println("Crawl Failed: " + e.getMessage());
            // Sample Data Fallback (Only on error)
            String serverDisplay = "baphomet".equals(server) ? "바포메트" : "이프리트";
            items.add(createVendingItem(1, "SampleVendor", serverDisplay, "100, 100", "Sample: " + itemName, 1000,
                    "General", "Common"));
            totalItems = 1;
        }

        result.put("data", items);
        result.put("total", totalItems);
        return result;
    }

    private static Map<String, Object> createVendingItem(int id, String vendorName, String serverName,
            String coordinates, String itemName, int price,
            String category, String rarity) {
        Map<String, Object> item = new HashMap<>();
        item.put("id", id);
        item.put("vendor_name", vendorName);
        item.put("server_name", serverName);
        item.put("coordinates", coordinates);
        item.put("item_name", itemName);
        item.put("quantity", "1");
        item.put("price", price);
        item.put("vendor_info", vendorName);
        item.put("category", category);
        item.put("rarity", rarity);
        return item;
    }
}
