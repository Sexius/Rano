package com.ragnarok.ragspringbackend.dto;

public class SkillDto {
    private String engName;
    private String nameKr;
    private Integer maxLevel;
    private Integer damagePercent;
    private Integer hits;

    // Constructors
    public SkillDto() {
    }

    public SkillDto(String engName, String nameKr, Integer maxLevel, Integer damagePercent, Integer hits) {
        this.engName = engName;
        this.nameKr = nameKr;
        this.maxLevel = maxLevel;
        this.damagePercent = damagePercent;
        this.hits = hits;
    }

    // Getters and Setters
    public String getEngName() {
        return engName;
    }

    public void setEngName(String engName) {
        this.engName = engName;
    }

    public String getNameKr() {
        return nameKr;
    }

    public void setNameKr(String nameKr) {
        this.nameKr = nameKr;
    }

    public Integer getMaxLevel() {
        return maxLevel;
    }

    public void setMaxLevel(Integer maxLevel) {
        this.maxLevel = maxLevel;
    }

    public Integer getDamagePercent() {
        return damagePercent;
    }

    public void setDamagePercent(Integer damagePercent) {
        this.damagePercent = damagePercent;
    }

    public Integer getHits() {
        return hits;
    }

    public void setHits(Integer hits) {
        this.hits = hits;
    }
}
