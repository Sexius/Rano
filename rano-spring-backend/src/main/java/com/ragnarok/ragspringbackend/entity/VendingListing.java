package com.ragnarok.ragspringbackend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 노점 스냅샷 엔티티 (크롤링 결과 저장)
 * 검색 API는 이 테이블만 조회 (fetch 없음)
 */
@Entity
@Table(name = "vending_listings", 
       uniqueConstraints = @UniqueConstraint(
           name = "uq_vending_listing",
           columnNames = {"server", "map_id", "ssi", "item_name"}
       ))
public class VendingListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String server;

    @Column(name = "map_id", length = 50)
    private String mapId;

    @Column(length = 50)
    private String ssi;

    @Column(name = "item_name", nullable = false, length = 255)
    private String itemName;

    @Column(name = "item_name_normalized", length = 255)
    private String itemNameNormalized;

    @Column(name = "item_id")
    private Integer itemId;

    @Column(nullable = false)
    private Long price;

    @Column(columnDefinition = "INTEGER DEFAULT 1")
    private Integer amount = 1;

    @Column(name = "shop_name", length = 255)
    private String shopName;

    @Column(name = "seller_name", length = 255)
    private String sellerName;

    @Column(name = "scraped_at", nullable = false)
    private LocalDateTime scrapedAt = LocalDateTime.now();

    @Column(name = "source_page", columnDefinition = "INTEGER DEFAULT 1")
    private Integer sourcePage = 1;

    // Constructors
    public VendingListing() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getServer() { return server; }
    public void setServer(String server) { this.server = server; }

    public String getMapId() { return mapId; }
    public void setMapId(String mapId) { this.mapId = mapId; }

    public String getSsi() { return ssi; }
    public void setSsi(String ssi) { this.ssi = ssi; }

    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }

    public String getItemNameNormalized() { return itemNameNormalized; }
    public void setItemNameNormalized(String itemNameNormalized) { this.itemNameNormalized = itemNameNormalized; }

    public Integer getItemId() { return itemId; }
    public void setItemId(Integer itemId) { this.itemId = itemId; }

    public Long getPrice() { return price; }
    public void setPrice(Long price) { this.price = price; }

    public Integer getAmount() { return amount; }
    public void setAmount(Integer amount) { this.amount = amount; }

    public String getShopName() { return shopName; }
    public void setShopName(String shopName) { this.shopName = shopName; }

    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }

    public LocalDateTime getScrapedAt() { return scrapedAt; }
    public void setScrapedAt(LocalDateTime scrapedAt) { this.scrapedAt = scrapedAt; }

    public Integer getSourcePage() { return sourcePage; }
    public void setSourcePage(Integer sourcePage) { this.sourcePage = sourcePage; }
}
