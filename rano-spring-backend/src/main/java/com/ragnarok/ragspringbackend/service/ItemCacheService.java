package com.ragnarok.ragspringbackend.service;

import com.ragnarok.ragspringbackend.entity.Item;
import com.ragnarok.ragspringbackend.repository.ItemRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory cache for item name -> id mapping.
 * Loaded at startup, refreshed every 10 minutes.
 * Eliminates DB queries for icon lookup (db=2889ms -> 0ms).
 */
@Service
public class ItemCacheService {

    private final ItemRepository itemRepository;
    private final Map<String, Integer> nameToIdMap = new ConcurrentHashMap<>();

    public ItemCacheService(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @PostConstruct
    public void init() {
        loadAllItems();
    }

    @Scheduled(fixedRate = 600000) // 10 minutes
    public void refreshCache() {
        loadAllItems();
    }

    private void loadAllItems() {
        long start = System.currentTimeMillis();
        List<Item> items = itemRepository.findAll();
        
        Map<String, Integer> newMap = new ConcurrentHashMap<>();
        for (Item item : items) {
            if (item.getNameKr() != null && !item.getNameKr().isEmpty()) {
                newMap.put(item.getNameKr(), item.getId());
            }
        }
        
        nameToIdMap.clear();
        nameToIdMap.putAll(newMap);
        
        long elapsed = System.currentTimeMillis() - start;
        System.out.println("[ItemCacheService] Loaded " + nameToIdMap.size() + " items in " + elapsed + "ms");
    }

    /**
     * Get item ID by exact name match.
     * @return item ID or null if not found
     */
    public Integer getIdByName(String nameKr) {
        return nameToIdMap.get(nameKr);
    }

    /**
     * Get item ID by prefix match (first match).
     * @return item ID or null if not found
     */
    public Integer getIdByPrefix(String prefix) {
        for (Map.Entry<String, Integer> entry : nameToIdMap.entrySet()) {
            if (entry.getKey().startsWith(prefix)) {
                return entry.getValue();
            }
        }
        return null;
    }

    /**
     * Get item ID by contains match (first match).
     * @return item ID or null if not found
     */
    public Integer getIdByContains(String keyword) {
        for (Map.Entry<String, Integer> entry : nameToIdMap.entrySet()) {
            if (entry.getKey().contains(keyword)) {
                return entry.getValue();
            }
        }
        return null;
    }

    public int getCacheSize() {
        return nameToIdMap.size();
    }
}
