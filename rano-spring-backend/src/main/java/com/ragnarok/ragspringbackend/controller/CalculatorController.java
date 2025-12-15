package com.ragnarok.ragspringbackend.controller;

import com.ragnarok.ragspringbackend.service.CalculatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class CalculatorController {

    @Autowired
    private CalculatorService calculatorService;

    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculateDamage(@RequestBody Map<String, Object> request) {
        try {
            int baseLevel = (Integer) request.getOrDefault("base_level", 1);
            int str = (Integer) request.getOrDefault("str", 1);
            int dex = (Integer) request.getOrDefault("dex", 1);
            int luk = (Integer) request.getOrDefault("luk", 1);
            int weaponAtk = (Integer) request.getOrDefault("weapon_atk", 0);
            int equipAtk = (Integer) request.getOrDefault("equip_atk", 0);
            int skillPercent = (Integer) request.getOrDefault("skill_percent", 100);
            int monsterDef = (Integer) request.getOrDefault("monster_def", 0);

            int finalDamage = calculatorService.calculateDamage(
                baseLevel, str, dex, luk, weaponAtk, equipAtk, skillPercent, monsterDef
            );

            return ResponseEntity.ok(Map.of("final_damage", finalDamage));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
