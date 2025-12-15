package com.ragnarok.ragspringbackend.repository;

import com.ragnarok.ragspringbackend.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Integer> {
    // JpaRepository가 자동으로 제공하는 메서드들:
    // - findById(Integer id): ID로 아이템 찾기
    // - findAll(): 모든 아이템 가져오기
    // - save(Item item): 아이템 저장
    // - delete(Item item): 아이템 삭제

    // [추가] 이름에 특정 단어가 포함되어 있으면 다 찾아줘! (LIKE 검색)
    List<Item> findByNameKrContaining(String keyword);
}
