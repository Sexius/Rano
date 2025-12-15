package com.ragnarok.ragspringbackend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DivinePrideItemDto {
    private int id;
    private String name;

    @JsonProperty("itemTypeId")
    private Integer itemTypeId;

    @JsonProperty("itemSubTypeId")
    private Integer itemSubTypeId;

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getItemTypeId() {
        return itemTypeId;
    }

    public void setItemTypeId(Integer itemTypeId) {
        this.itemTypeId = itemTypeId;
    }

    public Integer getItemSubTypeId() {
        return itemSubTypeId;
    }

    public void setItemSubTypeId(Integer itemSubTypeId) {
        this.itemSubTypeId = itemSubTypeId;
    }
}
