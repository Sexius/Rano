package com.ragnarok.ragspringbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// JPA/DataSource 활성화됨 - PostgreSQL DB 사용
@SpringBootApplication
public class RagSpringBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(RagSpringBackendApplication.class, args);
    }

}
