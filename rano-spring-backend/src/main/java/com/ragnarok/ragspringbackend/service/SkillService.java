package com.ragnarok.ragspringbackend.service;

import com.ragnarok.ragspringbackend.dto.SkillDto;
import com.ragnarok.ragspringbackend.entity.Skill;
import com.ragnarok.ragspringbackend.repository.SkillRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SkillService {

    @Autowired
    private SkillRepository skillRepository;

    /**
     * 특정 스킬 조회
     */
    public Optional<SkillDto> getSkill(String engName) {
        return skillRepository.findById(engName)
                .map(this::convertToDto);
    }

    /**
     * 데미지 정보가 있는 스킬 목록 조회
     */
    public List<SkillDto> getSkillsWithDamage() {
        return skillRepository.findByDamagePercentGreaterThan(100)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * 한글 이름으로 스킬 검색
     */
    public List<SkillDto> searchSkills(String keyword) {
        return skillRepository.findByNameKrContaining(keyword)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    /**
     * Entity -> DTO 변환
     */
    private SkillDto convertToDto(Skill skill) {
        return new SkillDto(
                skill.getEngName(),
                skill.getNameKr(),
                skill.getMaxLevel(),
                skill.getDamagePercent() != null ? skill.getDamagePercent() : 100,
                skill.getHits() != null ? skill.getHits() : 1);
    }
}
