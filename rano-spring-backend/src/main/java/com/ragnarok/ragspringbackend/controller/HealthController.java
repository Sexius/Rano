package com.ragnarok.ragspringbackend.controller;

import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Health Check Controller
 * - /api/ping: Lightweight endpoint for external keep-alive services (e.g.,
 * cron-job.org)
 * - Prevents Render.com free tier from sleeping after 15 minutes of inactivity
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class HealthController {

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Ultra-lightweight ping endpoint
     * - No DB queries
     * - No business logic
     * - Returns simple JSON for monitoring
     */
    @GetMapping("/ping")
    public PingResponse ping() {
        return new PingResponse("ok", LocalDateTime.now().format(formatter));
    }

    /**
     * Simple health check response
     */
    public static class PingResponse {
        private String status;
        private String timestamp;

        public PingResponse(String status, String timestamp) {
            this.status = status;
            this.timestamp = timestamp;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getTimestamp() {
            return timestamp;
        }

        public void setTimestamp(String timestamp) {
            this.timestamp = timestamp;
        }
    }
}
