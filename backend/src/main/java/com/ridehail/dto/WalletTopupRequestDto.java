package com.ridehail.dto;

import com.ridehail.model.WalletTransactionType;
import java.time.LocalDateTime;

public class WalletTopupRequestDto {
    private Double amount;
    private String paymentMethod; // UPI, CARD, NETBANKING

    public WalletTopupRequestDto() {}

    public WalletTopupRequestDto(Double amount, String paymentMethod) {
        this.amount = amount;
        this.paymentMethod = paymentMethod;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}
