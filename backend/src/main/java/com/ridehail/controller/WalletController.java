package com.ridehail.controller;

import com.ridehail.dto.WalletDto;
import com.ridehail.dto.WalletTopupRequestDto;
import com.ridehail.dto.WalletTransactionDto;
import com.ridehail.security.CustomUserDetails;
import com.ridehail.service.WalletService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/balance")
    public ResponseEntity<WalletDto> getWalletBalance(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(walletService.getWallet(userDetails.getId()));
    }

    @PostMapping("/topup")
    public ResponseEntity<WalletDto> topupWallet(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody WalletTopupRequestDto request
    ) {
        return ResponseEntity.ok(walletService.topup(userDetails.getId(), request.getAmount(), request.getPaymentMethod()));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<WalletTransactionDto>> getTransactions(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(walletService.getTransactions(userDetails.getId()));
    }
}
