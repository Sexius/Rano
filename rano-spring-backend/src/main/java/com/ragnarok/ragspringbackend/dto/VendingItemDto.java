package com.ragnarok.ragspringbackend.dto;

public class VendingItemDto {
    private int id;
    private String vendor_name;
    private String server_name;
    private String coordinates;
    private String item_name;
    private int quantity;
    private long price;
    private String vendor_info;
    private String category;
    private String rarity;
    private String image_url;
    private String ssi; // Original site String identifier
    private String map_id; // Original site Map identifier

    // Constructors
    public VendingItemDto() {
    }

    public VendingItemDto(int id, String vendor_name, String server_name, String coordinates,
            String item_name, int quantity, long price, String vendor_info,
            String category, String rarity) {
        this.id = id;
        this.vendor_name = vendor_name;
        this.server_name = server_name;
        this.coordinates = coordinates;
        this.item_name = item_name;
        this.quantity = quantity;
        this.price = price;
        this.vendor_info = vendor_info;
        this.category = category;
        this.rarity = rarity;
    }

    public VendingItemDto(int id, String vendor_name, String server_name, String coordinates,
            String item_name, int quantity, long price, String vendor_info,
            String category, String rarity, String ssi, String map_id) {
        this(id, vendor_name, server_name, coordinates, item_name, quantity, price, vendor_info, category, rarity);
        this.ssi = ssi;
        this.map_id = map_id;
    }

    // Getters and Setters
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getVendor_name() {
        return vendor_name;
    }

    public void setVendor_name(String vendor_name) {
        this.vendor_name = vendor_name;
    }

    public String getServer_name() {
        return server_name;
    }

    public void setServer_name(String server_name) {
        this.server_name = server_name;
    }

    public String getCoordinates() {
        return coordinates;
    }

    public void setCoordinates(String coordinates) {
        this.coordinates = coordinates;
    }

    public String getItem_name() {
        return item_name;
    }

    public void setItem_name(String item_name) {
        this.item_name = item_name;
    }

    public int getQuantity() {
        return quantity;
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }

    public long getPrice() {
        return price;
    }

    public void setPrice(long price) {
        this.price = price;
    }

    public String getVendor_info() {
        return vendor_info;
    }

    public void setVendor_info(String vendor_info) {
        this.vendor_info = vendor_info;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getRarity() {
        return rarity;
    }

    public void setRarity(String rarity) {
        this.rarity = rarity;
    }

    public String getImage_url() {
        return image_url;
    }

    public void setImage_url(String image_url) {
        this.image_url = image_url;
    }

    public String getSsi() {
        return ssi;
    }

    public void setSsi(String ssi) {
        this.ssi = ssi;
    }

    public String getMap_id() {
        return map_id;
    }

    public void setMap_id(String map_id) {
        this.map_id = map_id;
    }
}
