package com.ridehail.controller;

import com.ridehail.dto.*;
import com.ridehail.model.DailyScheduledRide;
import com.ridehail.model.DailyTripStatus;
import com.ridehail.model.Ride;
import com.ridehail.repository.DailyScheduledRideRepository;
import com.ridehail.security.CustomUserDetails;
import com.ridehail.service.SubscriptionSchedulerService;
import com.ridehail.service.SubscriptionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final SubscriptionSchedulerService subscriptionSchedulerService;
    private final DailyScheduledRideRepository dailyScheduledRideRepository;

    public SubscriptionController(
            SubscriptionService subscriptionService,
            SubscriptionSchedulerService subscriptionSchedulerService,
            DailyScheduledRideRepository dailyScheduledRideRepository
    ) {
        this.subscriptionService = subscriptionService;
        this.subscriptionSchedulerService = subscriptionSchedulerService;
        this.dailyScheduledRideRepository = dailyScheduledRideRepository;
    }

    @PostMapping("/estimate")
    public ResponseEntity<SubscriptionEstimateResponseDto> estimateSubscription(
            @RequestBody SubscriptionEstimateRequestDto request
    ) {
        return ResponseEntity.ok(subscriptionService.calculateEstimate(request));
    }

    @PostMapping("/create")
    public ResponseEntity<SubscriptionResponseDto> createSubscription(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody CreateSubscriptionRequestDto request
    ) {
        return ResponseEntity.ok(subscriptionService.createSubscription(userDetails.getId(), request));
    }

    @GetMapping("/rider/my")
    public ResponseEntity<List<SubscriptionResponseDto>> getMyRiderSubscriptions(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(subscriptionService.getRiderSubscriptions(userDetails.getId()));
    }

    @GetMapping("/driver/marketplace")
    public ResponseEntity<List<SubscriptionResponseDto>> getDriverMarketplace(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(subscriptionService.getMarketplaceSubscriptions(userDetails.getId()));
    }

    @GetMapping("/driver/my")
    public ResponseEntity<List<SubscriptionResponseDto>> getMyDriverSubscriptions(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        return ResponseEntity.ok(subscriptionService.getDriverSubscriptions(userDetails.getId()));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<SubscriptionResponseDto> acceptSubscription(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(subscriptionService.acceptSubscriptionContract(userDetails.getId(), id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<SubscriptionResponseDto> cancelSubscription(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(subscriptionService.cancelSubscription(userDetails.getId(), id));
    }

    /**
     * Instant 1-Click Simulation Tool: Dispatches today's commute trip immediately
     * so you don't have to wait for the exact clock time during testing!
     */
    @PostMapping("/{id}/simulate-dispatch")
    public ResponseEntity<SubscriptionResponseDto> simulateDailyDispatch(
            @PathVariable Long id
    ) {
        List<DailyScheduledRide> dailyRides = dailyScheduledRideRepository.findBySubscriptionIdOrderByTripDateAscScheduledTimeAsc(id);
        for (DailyScheduledRide daily : dailyRides) {
            if (daily.getStatus() == DailyTripStatus.SCHEDULED || daily.getStatus() == DailyTripStatus.BUFFER_ACTIVE) {
                subscriptionSchedulerService.dispatchTodayCommute(daily);
                break;
            }
        }
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions().stream()
                .filter(s -> s.getId().equals(id))
                .findFirst()
                .orElseThrow());
    }

    @GetMapping("/all")
    public ResponseEntity<List<SubscriptionResponseDto>> getAllSubscriptions() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions());
    }
}
