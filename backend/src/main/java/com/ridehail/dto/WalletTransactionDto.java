package com.ridehail.dto;

import com.ridehail.model.WalletTransactionType;
import java.time.LocalDateTime;

public class WalletTransactionDto {
    private Long id;
    private Double amount;
    private WalletTransactionType type;
    private String description;
    private LocalDateTime createdAt;

    public WalletTransactionDto() {}

    public WalletTransactionDto(Long id, Double amount, WalletTransactionType type, String description, LocalDateTime createdAt) {
        this.id = id;
        this.amount = amount;
        this.type = type;
        this.description = description;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public WalletTransactionType getType() {
        return type;
    }

    public void setType(WalletTransactionType type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
