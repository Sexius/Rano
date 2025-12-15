package com.ragnarok.ragspringbackend.controller;

import com.ragnarok.ragspringbackend.dto.SkillDto;
import com.ragnarok.ragspringbackend.service.SkillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/skills")
@CrossOrigin(origins = "*")
public class SkillController {

    @Autowired
    private SkillService skillService;

    /**
     * 특정 스킬 조회
     * GET /api/skills/{engName}
     */
    @GetMapping("/{engName}")
    public ResponseEntity<SkillDto> getSkill(@PathVariable String engName) {
        return skillService.getSkill(engName)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 데미지 정보가 있는 스킬 목록
     * GET /api/skills
     */
    @GetMapping
    public ResponseEntity<List<SkillDto>> getSkillsWithDamage() {
        List<SkillDto> skills = skillService.getSkillsWithDamage();
        return ResponseEntity.ok(skills);
    }

    /**
     * 스킬 검색
     * GET /api/skills/search?keyword=검색어
     */
    @GetMapping("/search")
    public ResponseEntity<List<SkillDto>> searchSkills(@RequestParam String keyword) {
        List<SkillDto> skills = skillService.searchSkills(keyword);
        return ResponseEntity.ok(skills);
    }
}
