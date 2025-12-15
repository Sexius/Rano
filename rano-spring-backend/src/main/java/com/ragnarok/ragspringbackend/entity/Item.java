package com.ragnarok.ragspringbackend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity // "이 클래스는 DB 테이블과 1:1로 연결된다"는 뜻
@Table(name = "items") // DB의 'items' 테이블을 바라봄
public class Item {

    @Id // 기본키 (PK)
    private Integer id;

    @Column(name = "name_kr") // DB 컬럼명 'name_kr'과 연결
    private String nameKr;

    @Column(columnDefinition = "TEXT") // 긴 글자(TEXT) 처리
    private String description;

    private Integer slots;

    @Column(name = "raw_data", columnDefinition = "json") // JSON 데이터 처리
    private String rawData;

    @Column(name = "parsed_data", columnDefinition = "json") // 파싱된 스탯 정보 (JSON)
    private String parsedData;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNameKr() {
        return nameKr;
    }

    public void setNameKr(String nameKr) {
        this.nameKr = nameKr;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSlots() {
        return slots;
    }

    public void setSlots(Integer slots) {
        this.slots = slots;
    }

    public String getRawData() {
        return rawData;
    }

    public void setRawData(String rawData) {
        this.rawData = rawData;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getParsedData() {
        return parsedData;
    }

    public void setParsedData(String parsedData) {
        this.parsedData = parsedData;
    }
}
