package com.ragnarok.ragspringbackend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class DivinePrideSearchResponse {
    private List<DivinePrideItemDto> items;

    public List<DivinePrideItemDto> getItems() {
        return items;
    }

    public void setItems(List<DivinePrideItemDto> items) {
        this.items = items;
    }
}
