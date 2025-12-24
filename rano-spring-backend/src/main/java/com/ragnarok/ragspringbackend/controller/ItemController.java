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

    // 1. 아이템 한 개 상세 조회 (JSON 반환)
    @GetMapping("/{id}")
    public ResponseEntity<Item> getItemById(@PathVariable Integer id) {
        Optional<Item> item = itemRepository.findById(id);

        // 아이템이 있으면: 그 객체를 그대로 리턴 (Spring이 자동으로 JSON으로 변환해줌)
        // 아이템이 없으면: 404 Not Found 에러 리턴
        return item.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 2. [추가] 이름으로 아이템 검색 API
    // 사용법: http://localhost:8080/api/items/search?keyword=포션
    @GetMapping("/search")
    public List<Item> searchItems(@RequestParam String keyword) {
        return itemRepository.findByNameKrContaining(keyword);
    }
}