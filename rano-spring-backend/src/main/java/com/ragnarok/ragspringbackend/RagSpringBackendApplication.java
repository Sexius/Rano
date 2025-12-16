package com.ragnarok.ragspringbackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;

// DB 연결 없이 서버 시작 가능하도록 JPA/DataSource 자동 설정 비활성화
@SpringBootApplication(exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class
})
public class RagSpringBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(RagSpringBackendApplication.class, args);
    }

}
