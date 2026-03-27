package com.ragnarok.ragspringbackend.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.Collections;
import java.util.Locale;
import java.util.Map;

@Component
public class GnjoyServerIdRegistry {

    private final Map<String, String> serverIds;

    public GnjoyServerIdRegistry(ObjectMapper objectMapper) throws IOException {
        ClassPathResource resource = new ClassPathResource("gnjoy-server-ids.json");
        try (InputStream inputStream = resource.getInputStream()) {
            this.serverIds = Collections.unmodifiableMap(
                objectMapper.readValue(inputStream, new TypeReference<Map<String, String>>() {})
            );
        }
    }

    public String normalizeServerName(String server) {
        if (server == null || server.isBlank()) {
            return "baphomet";
        }
        return server.trim().toLowerCase(Locale.ROOT);
    }

    public String getServerId(String server) {
        String normalized = normalizeServerName(server);
        return serverIds.getOrDefault(normalized, serverIds.get("baphomet"));
    }
}
