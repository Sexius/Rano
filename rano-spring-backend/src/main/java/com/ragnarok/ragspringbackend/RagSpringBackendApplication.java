package com.ragnarok.ragspringbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

// JPA/DataSource 활성화됨 - PostgreSQL DB 사용
@EnableCaching
@SpringBootApplication
public class RagSpringBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(RagSpringBackendApplication.class, args);
    }

}
