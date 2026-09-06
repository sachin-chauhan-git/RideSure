package com.ridehail;

import com.ridehail.dto.SubscriptionEstimateRequestDto;
import com.ridehail.dto.SubscriptionEstimateResponseDto;
import com.ridehail.dto.WalletDto;
import com.ridehail.model.Role;
import com.ridehail.model.SubscriptionType;
import com.ridehail.model.User;
import com.ridehail.model.VehicleType;
import com.ridehail.repository.UserRepository;
import com.ridehail.service.SubscriptionService;
import com.ridehail.service.WalletService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SubscriptionServiceTests {

    @Autowired
    private SubscriptionService subscriptionService;

    @Autowired
    private WalletService walletService;

    @Autowired
    private UserRepository userRepository;

    @Test
    void testSubscriptionDiscountCalculation() {
        // Test 30-Day Monthly Pass (25% Discount)
        SubscriptionEstimateRequestDto req30Days = new SubscriptionEstimateRequestDto();
        req30Days.setPickupLat(12.9716);
        req30Days.setPickupLng(77.5946);
        req30Days.setDropoffLat(12.9352);
        req30Days.setDropoffLng(77.6245);
        req30Days.setVehicleType(VehicleType.BIKE);
        req30Days.setSubscriptionType(SubscriptionType.ROUND_TRIP);
        req30Days.setStartDate(LocalDate.now());
        req30Days.setEndDate(LocalDate.now().plusDays(29)); // 30 days

        SubscriptionEstimateResponseDto res30 = subscriptionService.calculateEstimate(req30Days);
        assertEquals(30, res30.getTotalDays());
        assertEquals(60, res30.getTotalTrips()); // Round trip = 2 trips/day
        assertEquals(25.0, res30.getDiscountPercentage(), "30-day pass should receive 25% discount");
        assertTrue(res30.getTotalSavings() > 0);
        assertTrue(res30.getDiscountedPackageCost() < res30.getStandardTotalCost());

        // Test 10-Day Pass (12% Discount)
        SubscriptionEstimateRequestDto req10Days = new SubscriptionEstimateRequestDto();
        req10Days.setPickupLat(12.9716);
        req10Days.setPickupLng(77.5946);
        req10Days.setDropoffLat(12.9352);
        req10Days.setDropoffLng(77.6245);
        req10Days.setVehicleType(VehicleType.BIKE);
        req10Days.setSubscriptionType(SubscriptionType.ONE_WAY);
        req10Days.setStartDate(LocalDate.now());
        req10Days.setEndDate(LocalDate.now().plusDays(9)); // 10 days

        SubscriptionEstimateResponseDto res10 = subscriptionService.calculateEstimate(req10Days);
        assertEquals(10, res10.getTotalDays());
        assertEquals(10, res10.getTotalTrips());
        assertEquals(12.0, res10.getDiscountPercentage(), "10-day pass should receive 12% discount");
    }

    @Test
    void testWalletEscrowLockAndDeduct() {
        User testUser = userRepository.findByEmail("rider@test.com").orElseGet(() -> {
            User u = new User("Test Rider", "test.rider.sub@test.com", "+919111122222", "pass", Role.ROLE_RIDER);
            return userRepository.save(u);
        });

        // Top up wallet
        WalletDto wallet = walletService.topup(testUser.getId(), 2000.0, "UPI");
        assertTrue(wallet.getBalance() >= 2000.0);

        // Lock escrow
        double initialLocked = wallet.getLockedEscrowBalance();
        walletService.lockEscrow(testUser.getId(), 500.0, 999L);
        WalletDto updatedWallet = walletService.getWallet(testUser.getId());
        assertEquals(initialLocked + 500.0, updatedWallet.getLockedEscrowBalance(), 0.1);
    }
}
