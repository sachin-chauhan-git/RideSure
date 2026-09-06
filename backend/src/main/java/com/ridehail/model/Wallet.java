package com.ridehail.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wallets")
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    @Column(nullable = false)
    private Double balance = 0.0;

    @Column(nullable = false)
    private Double lockedEscrowBalance = 0.0;

    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    public Wallet() {}

    public Wallet(User user, Double initialBalance) {
        this.user = user;
        this.balance = initialBalance;
        this.lockedEscrowBalance = 0.0;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
