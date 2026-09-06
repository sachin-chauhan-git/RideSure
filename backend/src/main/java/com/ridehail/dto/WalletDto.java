package com.ridehail.dto;

import com.ridehail.model.WalletTransactionType;
import java.time.LocalDateTime;

public class WalletDto {
    private Long id;
    private Long userId;
    private Double balance;
    private Double lockedEscrowBalance;
    private Double availableBalance;
    private LocalDateTime updatedAt;

    public WalletDto() {}

    public WalletDto(Long id, Long userId, Double balance, Double lockedEscrowBalance, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.balance = balance;
        this.lockedEscrowBalance = lockedEscrowBalance;
        this.availableBalance = Math.max(0.0, balance - lockedEscrowBalance);
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Double getBalance() {
        return balance;
    }

    public void setBalance(Double balance) {
        this.balance = balance;
    }

    public Double getLockedEscrowBalance() {
        return lockedEscrowBalance;
    }

    public void setLockedEscrowBalance(Double lockedEscrowBalance) {
        this.lockedEscrowBalance = lockedEscrowBalance;
    }

    public Double getAvailableBalance() {
        return availableBalance;
    }

    public void setAvailableBalance(Double availableBalance) {
        this.availableBalance = availableBalance;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
