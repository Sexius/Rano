package com.ragnarok.ragspringbackend.controller;

import com.ragnarok.ragspringbackend.service.DivinePrideService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/divine")
public class DivinePrideController {

    private final DivinePrideService divinePrideService;

    @Autowired
    public DivinePrideController(DivinePrideService divinePrideService) {
        this.divinePrideService = divinePrideService;
    }

    @GetMapping("/item/{id}")
    public String getItem(@PathVariable int id, @RequestParam(required = false, defaultValue = "kRO") String server) {
        return divinePrideService.getItem(id, server);
    }

    @GetMapping("/search")
    public String searchItem(@RequestParam String query) {
        return divinePrideService.searchItem(query);
    }

    @GetMapping("/monster/{id}")
    public String getMonster(@PathVariable int id) {
        return divinePrideService.getMonster(id);
    }
}
