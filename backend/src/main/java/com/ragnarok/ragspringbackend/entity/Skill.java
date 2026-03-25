package com.ragnarok.ragspringbackend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "skills")
public class Skill {

    @Id
    @Column(name = "eng_name")
    private String engName;

    @Column(name = "name_kr")
    private String nameKr;

    @Column(name = "max_level")
    private Integer maxLevel;

    @Column(name = "damage_percent")
    private Integer damagePercent;

    @Column(name = "hits")
    private Integer hits;

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
