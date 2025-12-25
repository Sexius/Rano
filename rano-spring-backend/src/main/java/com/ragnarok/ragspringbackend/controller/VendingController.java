package com.ragnarok.ragspringbackend.controller;

import com.ragnarok.ragspringbackend.dto.VendingItemDto;
import com.ragnarok.ragspringbackend.dto.VendingPageResponse;
import com.ragnarok.ragspringbackend.service.VendingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class VendingController {

    private final VendingService vendingService;
    private static final int DEFAULT_PAGE_SIZE = 10;

    public VendingController(VendingService vendingService) {
        this.vendingService = vendingService;
    }

    @GetMapping("/vending")
    public ResponseEntity<VendingPageResponse<VendingItemDto>> getVendingData(
            @RequestParam(required = false) String item,
            @RequestParam(defaultValue = "baphomet") String server,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(required = false) Integer size) {
        try {
            int pageSize = (size != null && size > 0) ? size : DEFAULT_PAGE_SIZE;
            VendingPageResponse<VendingItemDto> result;

            if (item != null && !item.trim().isEmpty()) {
                result = vendingService.searchVendingByItem(item, server, page, pageSize);
            } else {
                result = vendingService.getAllVendingData(server, page, pageSize);
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/vending/detail")
    public ResponseEntity<VendingItemDto> getVendingDetail(
            @RequestParam String server,
            @RequestParam String ssi,
            @RequestParam String mapID) {
        try {
            VendingItemDto result = vendingService.getVendingDetail(server, ssi, mapID);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
