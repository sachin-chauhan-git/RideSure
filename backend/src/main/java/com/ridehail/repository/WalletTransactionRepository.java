package com.ridehail.repository;

import com.ridehail.model.Wallet;
import com.ridehail.model.WalletTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {
    List<WalletTransaction> findByWalletOrderByCreatedAtDesc(Wallet wallet);
    List<WalletTransaction> findByWalletIdOrderByCreatedAtDesc(Long walletId);
}
