package com.ridehail.service;

import com.ridehail.dto.WalletDto;
import com.ridehail.dto.WalletTransactionDto;
import com.ridehail.model.*;
import com.ridehail.repository.UserRepository;
import com.ridehail.repository.WalletRepository;
import com.ridehail.repository.WalletTransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final UserRepository userRepository;

    public WalletService(
            WalletRepository walletRepository,
            WalletTransactionRepository walletTransactionRepository,
            UserRepository userRepository
    ) {
        this.walletRepository = walletRepository;
        this.walletTransactionRepository = walletTransactionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Wallet getOrCreateWalletEntity(Long userId) {
        return walletRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            // Default initial balance (e.g. ₹1000 for riders so they can immediately test without friction)
            double initial = user.getRole() == Role.ROLE_RIDER ? 1500.0 : 0.0;
            Wallet wallet = new Wallet(user, initial);
            Wallet saved = walletRepository.save(wallet);
            if (initial > 0) {
                walletTransactionRepository.save(new WalletTransaction(
                        saved,
                        initial,
                        WalletTransactionType.TOPUP,
                        "Welcome bonus credit"
                ));
            }
            return saved;
        });
    }

    @Transactional(readOnly = true)
    public WalletDto getWallet(Long userId) {
        Wallet wallet = getOrCreateWalletEntity(userId);
        return mapToWalletDto(wallet);
    }

    @Transactional
    public WalletDto topup(Long userId, Double amount, String paymentMethod) {
        if (amount == null || amount <= 0) {
            throw new RuntimeException("Top-up amount must be greater than 0");
        }
        Wallet wallet = getOrCreateWalletEntity(userId);
        wallet.setBalance(wallet.getBalance() + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        Wallet saved = walletRepository.save(wallet);

        walletTransactionRepository.save(new WalletTransaction(
                saved,
                amount,
                WalletTransactionType.TOPUP,
                "Wallet top-up via " + (paymentMethod != null ? paymentMethod : "UPI")
        ));

        return mapToWalletDto(saved);
    }

    @Transactional
    public void lockEscrow(Long userId, Double amount, Long subscriptionId) {
        Wallet wallet = getOrCreateWalletEntity(userId);
        double available = wallet.getBalance() - wallet.getLockedEscrowBalance();
        if (available < amount) {
            throw new RuntimeException(String.format("Insufficient wallet balance. Available: ₹%.2f, Required: ₹%.2f. Please top up your wallet.", available, amount));
        }

        wallet.setLockedEscrowBalance(wallet.getLockedEscrowBalance() + amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);

        walletTransactionRepository.save(new WalletTransaction(
                wallet,
                amount,
                WalletTransactionType.ESCROW_LOCK,
                "Locked in escrow for Subscription Pass #" + subscriptionId
        ));
    }

    @Transactional
    public void settleDailySubscriptionTrip(Long riderId, Long driverId, Double amount, Long subscriptionId) {
        // 1. Deduct from Rider's wallet & escrow
        Wallet riderWallet = getOrCreateWalletEntity(riderId);
        riderWallet.setLockedEscrowBalance(Math.max(0.0, riderWallet.getLockedEscrowBalance() - amount));
        riderWallet.setBalance(Math.max(0.0, riderWallet.getBalance() - amount));
        riderWallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(riderWallet);

        walletTransactionRepository.save(new WalletTransaction(
                riderWallet,
                amount,
                WalletTransactionType.DAILY_DEDUCT,
                "Auto-pay daily commute trip for Subscription Pass #" + subscriptionId
        ));

        // 2. Credit to Driver's wallet earnings
        if (driverId != null) {
            Wallet driverWallet = getOrCreateWalletEntity(driverId);
            driverWallet.setBalance(driverWallet.getBalance() + amount);
            driverWallet.setUpdatedAt(LocalDateTime.now());
            walletRepository.save(driverWallet);

            walletTransactionRepository.save(new WalletTransaction(
                    driverWallet,
                    amount,
                    WalletTransactionType.DRIVER_PAYOUT,
                    "Daily earnings payout for Subscription Pass #" + subscriptionId
            ));
        }
    }

    @Transactional
    public void refundRemainingEscrow(Long riderId, Double remainingEscrow, Long subscriptionId) {
        if (remainingEscrow != null && remainingEscrow > 0) {
            Wallet wallet = getOrCreateWalletEntity(riderId);
            wallet.setLockedEscrowBalance(Math.max(0.0, wallet.getLockedEscrowBalance() - remainingEscrow));
            wallet.setUpdatedAt(LocalDateTime.now());
            walletRepository.save(wallet);

            walletTransactionRepository.save(new WalletTransaction(
                    wallet,
                    remainingEscrow,
                    WalletTransactionType.REFUND,
                    "Unlocked remaining escrow refund for cancelled Subscription #" + subscriptionId
            ));
        }
    }

    @Transactional(readOnly = true)
    public List<WalletTransactionDto> getTransactions(Long userId) {
        Wallet wallet = getOrCreateWalletEntity(userId);
        return walletTransactionRepository.findByWalletOrderByCreatedAtDesc(wallet).stream()
                .map(t -> new WalletTransactionDto(t.getId(), t.getAmount(), t.getType(), t.getDescription(), t.getCreatedAt()))
                .collect(Collectors.toList());
    }

    public WalletDto mapToWalletDto(Wallet wallet) {
        return new WalletDto(
                wallet.getId(),
                wallet.getUser().getId(),
                wallet.getBalance(),
                wallet.getLockedEscrowBalance(),
                wallet.getUpdatedAt()
        );
    }
}
