package com.ragnarok.ragspringbackend.controller;

import com.ragnarok.ragspringbackend.entity.Item;
import com.ragnarok.ragspringbackend.repository.ItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

// JPA 활성화됨 - 아이템 검색 API 사용 가능
@RestController
@RequestMapping("/api/items")
public class ItemController {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private com.ragnarok.ragspringbackend.service.ItemService itemService;

    // 1. 아이템 한 개 상세 조회 (JSON 반환)
    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Integer id) {
        Optional<Item> itemOpt = itemRepository.findById(id);

        if (itemOpt.isPresent()) {
            Item item = itemOpt.get();
            // Lazy fill if description is missing
            if (isDescriptionMissing(item)) {
                fillItemDescription(item);
            }
            return ResponseEntity.ok(item);
        }

        return ResponseEntity.notFound().build();
    }

    // 2. [추가] 이름으로 아이템 검색 API
    // 사용법: http://localhost:8080/api/items/search?keyword=포션
    @GetMapping("/search")
    public List<Item> searchItems(@RequestParam String keyword) {
        List<Item> items = itemRepository.findByNameKrContaining(keyword);

        // Lazy fill missing descriptions for top 5 items (to avoid excessive API calls)
        items.stream()
                .filter(this::isDescriptionMissing)
                .limit(5)
                .forEach(this::fillItemDescription);

        return items;
    }

    private boolean isDescriptionMissing(Item item) {
        String desc = item.getDescription();
        return desc == null || desc.trim().isEmpty() || desc.equals("null") || desc.equals("없음");
    }

    private void fillItemDescription(Item item) {
        try {
            java.util.Map<String, Object> info = itemService.getItemInfo(item.getId());
            if (info != null && info.get("description") != null) {
                String newDesc = (String) info.get("description");
                item.setDescription(newDesc);

                // Update slots too if available and missing
                if (item.getSlots() == null || item.getSlots() == 0) {
                    Object slotsObj = info.get("slots");
                    if (slotsObj instanceof Number) {
                        item.setSlots(((Number) slotsObj).intValue());
                    }
                }

                itemRepository.save(item);
                System.out
                        .println("✅ Lazy-filled description for item: " + item.getNameKr() + " (" + item.getId() + ")");
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to lazy-fill item " + item.getId() + ": " + e.getMessage());
        }
    }
}