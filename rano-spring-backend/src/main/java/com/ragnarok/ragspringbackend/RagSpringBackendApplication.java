package com.ragnarok.ragspringbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

// JPA/DataSource 활성화됨 - PostgreSQL DB 사용
@EnableAsync
@EnableCaching
@EnableScheduling
@SpringBootApplication
public class RagSpringBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(RagSpringBackendApplication.class, args);
    }

}
