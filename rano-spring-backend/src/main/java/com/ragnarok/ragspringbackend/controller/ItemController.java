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

    // Divine Pride lazy-fill removed - DB only mode
    // @Autowired
    // private com.ragnarok.ragspringbackend.service.ItemService itemService;

    // 1. 아이템 한 개 상세 조회 (JSON 반환)
    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Integer id) {
        Optional<Item> itemOpt = itemRepository.findById(id);

        if (itemOpt.isPresent()) {
            Item item = itemOpt.get();
            // [BLOCKED] Divine Pride lazy-fill disabled
            // Description이 없으면 그대로 반환 (프론트에서 "설명 없음" 처리)
            return ResponseEntity.ok(item);
        }

        return ResponseEntity.notFound().build();
    }

    // 2. 이름으로 아이템 검색 API
    // 사용법: http://localhost:8080/api/items/search?keyword=포션
    @GetMapping("/search")
    public List<Item> searchItems(@RequestParam String keyword) {
        List<Item> items = itemRepository.findByNameKrContaining(keyword);
        // [BLOCKED] Divine Pride lazy-fill disabled
        // Description이 없는 아이템은 그대로 반환
        return items;
    }
}
