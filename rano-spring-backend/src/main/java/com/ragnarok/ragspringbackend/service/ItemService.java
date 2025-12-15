package com.ragnarok.ragspringbackend.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Map;

@Service
public class ItemService {

    private final RestTemplate restTemplate = new RestTemplate();

    @org.springframework.beans.factory.annotation.Value("${divine.pride.api.key}")
    private String apiKey;

    @org.springframework.beans.factory.annotation.Value("${divine.pride.api.url}")
    private String baseUrl;

    public List<Map<String, Object>> searchItems(String query) {
        List<Map<String, Object>> items = new java.util.ArrayList<>();
        try {
            String encodedQuery = java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8);
            String url = "https://www.divine-pride.net/database/search?q=" + encodedQuery;

            org.jsoup.nodes.Document doc = org.jsoup.Jsoup.connect(url)
                    .userAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
                    .header("Accept-Language", "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7")
                    .get();

            org.jsoup.select.Elements rows = doc.select("table tbody tr");
            for (org.jsoup.nodes.Element row : rows) {
                org.jsoup.nodes.Element link = row.selectFirst("a[href^='/database/item/']");
                if (link != null) {
                    try {
                        String href = link.attr("href");
                        // href format: /database/item/12345/name
                        String[] parts = href.split("/");
                        if (parts.length >= 4) {
                            int id = Integer.parseInt(parts[3]);
                            String name = link.text();

                            Map<String, Object> item = new java.util.HashMap<>();
                            item.put("id", id);
                            item.put("name", name);
                            items.add(item);
                        }
                    } catch (Exception e) {
                        // Ignore parse errors for specific rows
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return items;
    }

    public Map<String, Object> getItemInfo(int itemId) {
        // Use kROM server for Korean data context
        String url = baseUrl + "/Item/" + itemId + "?apiKey=" + apiKey + "&server=kROM";
        System.out.println("Calling Divine Pride API: " + url);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.set("User-Agent", "Mozilla/5.0");
        // Request Korean data
        headers.set("Accept-Language", "ko-KR");

        org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(url, org.springframework.http.HttpMethod.GET, entity,
                Map.class);
        Map<String, Object> data = (Map<String, Object>) response.getBody();

        // Copy all data first to ensure we don't miss fields like slots, requiredLevel,
        // etc.
        Map<String, Object> result = new java.util.HashMap<>(data);

        // Clean Description
        Object descObj = result.get("description");
        if (descObj instanceof String) {
            String rawDesc = (String) descObj;
            String cleanedDesc = com.ragnarok.ragspringbackend.util.RagDescriptionUtils.cleanCardDescription(rawDesc);
            result.put("description", cleanedDesc);
            result.put("descriptionLines", com.ragnarok.ragspringbackend.util.RagDescriptionUtils.toLines(cleanedDesc));
        }

        // Adjust Weight (Divine Pride returns weight * 10)
        Object weightObj = data.get("weight");
        if (weightObj instanceof Number) {
            result.put("weight", ((Number) weightObj).doubleValue() / 10);
        } else {
            result.put("weight", 0.0);
        }

        return result;
    }
}
