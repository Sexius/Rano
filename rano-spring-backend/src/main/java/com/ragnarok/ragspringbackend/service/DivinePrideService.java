package com.ragnarok.ragspringbackend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

@Service
public class DivinePrideService {

    @Value("${divine.pride.api.key}")
    private String apiKey;

    @Value("${divine.pride.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate;

    public DivinePrideService() {
        this.restTemplate = new RestTemplate();
    }

    public String getItem(int id, String server) {
        String url = String.format("%s/Item/%d?apiKey=%s&server=%s", apiUrl, id, apiKey,
                server != null ? server : "kRO");
        return fetchFromApi(url);
    }

    public String searchItem(String query) {
        try {
            String encodedQuery = java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8.toString());
            // Divine Pride Search endpoint - verified working endpoint
            String url = String.format("%s/Search?query=%s&server=kRO&apiKey=%s", apiUrl, encodedQuery, apiKey);
            System.out.println("DP search URL = " + url);
            return fetchFromApi(url);
        } catch (Exception e) {
            e.printStackTrace();
            return "{\"error\": \"Encoding error\"}";
        }
    }

    public String getMonster(int id) {
        String url = String.format("%s/Monster/%d?apiKey=%s", apiUrl, id, apiKey);
        return fetchFromApi(url);
    }

    private String fetchFromApi(String url) {
        try {
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("User-Agent", "Mozilla/5.0");
            headers.set("Accept-Language", "ko-KR");
            headers.set("Accept", "application/json");

            org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    org.springframework.http.HttpMethod.GET,
                    entity,
                    String.class);

            String body = response.getBody();
            System.out.println("DP API response length: " + (body != null ? body.length() : 0));
            return body;
        } catch (Exception e) {
            System.err.println("Error fetching from Divine Pride: " + e.getMessage());
            e.printStackTrace();
            return "{\"error\": \"Failed to fetch data\"}";
        }
    }
}
