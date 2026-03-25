package com.ragnarok.ragspringbackend.repository;

import com.ragnarok.ragspringbackend.entity.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SkillRepository extends JpaRepository<Skill, String> {

    // 데미지 정보가 있는 스킬만 조회 (damage_percent > 100)
    List<Skill> findByDamagePercentGreaterThan(Integer minPercent);

    // 한글 이름으로 검색
    List<Skill> findByNameKrContaining(String keyword);
}
