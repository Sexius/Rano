package com.ragnarok.ragspringbackend.controller;

import com.ragnarok.ragspringbackend.service.DivinePrideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Divine Pride API Proxy - ADMIN ONLY
 * 일반 사용자/프론트엔드에서 호출 금지
 * 관리자 토큰 필수: X-Admin-Token 헤더
 */
@RestController
@RequestMapping("/api/admin/divine")
public class DivinePrideController {

    private final DivinePrideService divinePrideService;

    @Value("${admin.token:changeme}")
    private String adminToken;

    @Autowired
    public DivinePrideController(DivinePrideService divinePrideService) {
        this.divinePrideService = divinePrideService;
    }

    private boolean isValidAdminToken(String token) {
        return adminToken != null && adminToken.equals(token);
    }

    @GetMapping("/item/{id}")
    public ResponseEntity<String> getItem(
            @PathVariable int id,
            @RequestParam(required = false, defaultValue = "kRO") String server,
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        
        if (!isValidAdminToken(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("{\"error\": \"Admin token required\"}");
        }
        return ResponseEntity.ok(divinePrideService.getItem(id, server));
    }

    @GetMapping("/search")
    public ResponseEntity<String> searchItem(
            @RequestParam String query,
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        
        if (!isValidAdminToken(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("{\"error\": \"Admin token required\"}");
        }
        return ResponseEntity.ok(divinePrideService.searchItem(query));
    }

    @GetMapping("/monster/{id}")
    public ResponseEntity<String> getMonster(
            @PathVariable int id,
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        
        if (!isValidAdminToken(token)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("{\"error\": \"Admin token required\"}");
        }
        return ResponseEntity.ok(divinePrideService.getMonster(id));
    }
}

