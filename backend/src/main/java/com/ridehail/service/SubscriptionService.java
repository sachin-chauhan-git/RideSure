package com.ridehail.service;

import com.ridehail.dto.*;
import com.ridehail.model.*;
import com.ridehail.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubscriptionService {

    private final RideSubscriptionRepository subscriptionRepository;
    private final DailyScheduledRideRepository dailyScheduledRideRepository;
    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final GoogleRoutesService googleRoutesService;
    private final FareCalculationService fareCalculationService;
    private final WalletService walletService;
    private final SimpMessagingTemplate messagingTemplate;

    public SubscriptionService(
            RideSubscriptionRepository subscriptionRepository,
            DailyScheduledRideRepository dailyScheduledRideRepository,
            UserRepository userRepository,
            DriverProfileRepository driverProfileRepository,
            GoogleRoutesService googleRoutesService,
            FareCalculationService fareCalculationService,
            WalletService walletService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.subscriptionRepository = subscriptionRepository;
        this.dailyScheduledRideRepository = dailyScheduledRideRepository;
        this.userRepository = userRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.googleRoutesService = googleRoutesService;
        this.fareCalculationService = fareCalculationService;
        this.walletService = walletService;
        this.messagingTemplate = messagingTemplate;
    }

    public SubscriptionEstimateResponseDto calculateEstimate(SubscriptionEstimateRequestDto request) {
        LocalDate start = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate end = request.getEndDate() != null ? request.getEndDate() : start.plusDays(29);

        if (end.isBefore(start)) {
            throw new RuntimeException("End date cannot be before start date");
        }

        int totalDays = (int) ChronoUnit.DAYS.between(start, end) + 1;
        SubscriptionType subType = request.getSubscriptionType() != null ? request.getSubscriptionType() : SubscriptionType.ONE_WAY;
        int totalTrips = totalDays * (subType == SubscriptionType.ROUND_TRIP ? 2 : 1);

        GoogleRoutesService.RouteResult route = googleRoutesService.computeRoute(
                request.getPickupLat(),
                request.getPickupLng(),
                request.getDropoffLat(),
                request.getDropoffLng()
        );

        VehicleType vType = request.getVehicleType() != null ? request.getVehicleType() : VehicleType.BIKE;
        double baseSingleFare = fareCalculationService.calculateFare(vType, route.getDistanceKm(), route.getDurationMinutes(), 1.0);
        double standardTotalCost = baseSingleFare * totalTrips;

        // Tiered multi-day discounts
        double discountPercent;
        if (totalDays >= 30) {
            discountPercent = 25.0; // 25% off monthly pass
        } else if (totalDays >= 20) {
            discountPercent = 18.0;
        } else if (totalDays >= 10) {
            discountPercent = 12.0;
        } else if (totalDays >= 5) {
            discountPercent = 5.0;
        } else {
            discountPercent = 0.0;
        }

        double discountedPackageCost = Math.round((standardTotalCost * (1.0 - (discountPercent / 100.0))) * 100.0) / 100.0;
        double dailyEffectiveRate = Math.round((discountedPackageCost / totalDays) * 100.0) / 100.0;
        double totalSavings = Math.round((standardTotalCost - discountedPackageCost) * 100.0) / 100.0;

        SubscriptionEstimateResponseDto dto = new SubscriptionEstimateResponseDto();
        dto.setVehicleType(vType);
        dto.setSubscriptionType(subType);
        dto.setTotalDays(totalDays);
        dto.setTotalTrips(totalTrips);
        dto.setDistanceKm(route.getDistanceKm());
        dto.setBaseSingleFare(baseSingleFare);
        dto.setStandardTotalCost(standardTotalCost);
        dto.setDiscountPercentage(discountPercent);
        dto.setDiscountedPackageCost(discountedPackageCost);
        dto.setDailyEffectiveRate(dailyEffectiveRate);
        dto.setTotalSavings(totalSavings);
        dto.setRoutePolyline(route.getEncodedPolyline());

        return dto;
    }

    @Transactional
    public SubscriptionResponseDto createSubscription(Long riderId, CreateSubscriptionRequestDto request) {
        User rider = userRepository.findById(riderId)
                .orElseThrow(() -> new RuntimeException("Rider not found"));

        LocalDate start = request.getStartDate() != null ? request.getStartDate() : LocalDate.now();
        LocalDate end = request.getEndDate() != null ? request.getEndDate() : start.plusDays(29);

        if (end.isBefore(start)) {
            throw new RuntimeException("End date cannot be before start date");
        }

        int totalDays = (int) ChronoUnit.DAYS.between(start, end) + 1;
        SubscriptionType subType = request.getSubscriptionType() != null ? request.getSubscriptionType() : SubscriptionType.ONE_WAY;
        int totalTrips = totalDays * (subType == SubscriptionType.ROUND_TRIP ? 2 : 1);

        double totalPackageCost = request.getTotalPackageCost() != null ? request.getTotalPackageCost() : 1000.0;
        double perTripFare = Math.round((totalPackageCost / totalTrips) * 100.0) / 100.0;

        RideSubscription subscription = new RideSubscription();
        subscription.setRider(rider);
        subscription.setVehicleType(request.getVehicleType());
        subscription.setSubscriptionType(subType);
        subscription.setStartDate(start);
        subscription.setEndDate(end);
        subscription.setTotalDays(totalDays);
        subscription.setPickupAddress(request.getPickupAddress());
        subscription.setPickupLat(request.getPickupLat());
        subscription.setPickupLng(request.getPickupLng());
        subscription.setDropoffAddress(request.getDropoffAddress());
        subscription.setDropoffLat(request.getDropoffLat());
        subscription.setDropoffLng(request.getDropoffLng());
        subscription.setOutwardTimeSlot(request.getOutwardTimeSlot());
        subscription.setReturnTimeSlot(request.getReturnTimeSlot());
        subscription.setDistanceKm(request.getDistanceKm());
        subscription.setPerRideFare(perTripFare);
        subscription.setDiscountPercentage(request.getDiscountPercentage() != null ? request.getDiscountPercentage() : 0.0);
        subscription.setTotalPackageCost(totalPackageCost);
        subscription.setEscrowAmountLocked(totalPackageCost);
        subscription.setStatus(SubscriptionStatus.PENDING_DRIVER);
        subscription.setRoutePolyline(request.getRoutePolyline());

        RideSubscription savedSub = subscriptionRepository.save(subscription);

        // Lock amount in escrow
        walletService.lockEscrow(riderId, totalPackageCost, savedSub.getId());

        // Generate individual DailyScheduledRide roster
        List<DailyScheduledRide> roster = new ArrayList<>();
        LocalDate cur = start;
        while (!cur.isAfter(end)) {
            // Outward trip
            roster.add(new DailyScheduledRide(
                    savedSub,
                    cur,
                    TripLeg.OUTWARD,
                    request.getOutwardTimeSlot(),
                    null,
                    perTripFare
            ));
            // Return trip (if round trip)
            if (subType == SubscriptionType.ROUND_TRIP && request.getReturnTimeSlot() != null) {
                roster.add(new DailyScheduledRide(
                        savedSub,
                        cur,
                        TripLeg.RETURN,
                        request.getReturnTimeSlot(),
                        null,
                        perTripFare
                ));
            }
            cur = cur.plusDays(1);
        }
        dailyScheduledRideRepository.saveAll(roster);
        savedSub.setDailyRides(roster);

        SubscriptionResponseDto responseDto = mapToSubscriptionResponse(savedSub);

        // Broadcast to Driver Marketplace topic
        messagingTemplate.convertAndSend("/topic/subscriptions/marketplace", responseDto);

        return responseDto;
    }

    @Transactional
    public SubscriptionResponseDto acceptSubscriptionContract(Long driverId, Long subscriptionId) {
        RideSubscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found with id: " + subscriptionId));

        if (subscription.getStatus() != SubscriptionStatus.PENDING_DRIVER) {
            throw new RuntimeException("Subscription is no longer open (Status: " + subscription.getStatus() + ")");
        }

        User driver = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver user not found"));

        subscription.setDriver(driver);
        subscription.setStatus(SubscriptionStatus.ACTIVE);
        RideSubscription saved = subscriptionRepository.save(subscription);

        // Assign driver to all pending scheduled rides for this subscription
        List<DailyScheduledRide> dailyRides = dailyScheduledRideRepository.findBySubscriptionIdOrderByTripDateAscScheduledTimeAsc(subscriptionId);
        for (DailyScheduledRide daily : dailyRides) {
            if (daily.getStatus() == DailyTripStatus.SCHEDULED) {
                daily.setAssignedDriver(driver);
            }
        }
        dailyScheduledRideRepository.saveAll(dailyRides);
        saved.setDailyRides(dailyRides);

        SubscriptionResponseDto responseDto = mapToSubscriptionResponse(saved);

        // Notify Rider & Marketplace
        messagingTemplate.convertAndSend("/topic/rider/" + subscription.getRider().getId() + "/subscription", responseDto);
        messagingTemplate.convertAndSend("/topic/subscriptions/claimed", responseDto);

        return responseDto;
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponseDto> getMarketplaceSubscriptions(Long driverId) {
        DriverProfile profile = driverProfileRepository.findByUserId(driverId).orElse(null);
        VehicleType vType = profile != null ? profile.getVehicleType() : null;

        List<RideSubscription> list = (vType != null)
                ? subscriptionRepository.findByStatusAndVehicleType(SubscriptionStatus.PENDING_DRIVER, vType)
                : subscriptionRepository.findByStatus(SubscriptionStatus.PENDING_DRIVER);

        return list.stream().map(this::mapToSubscriptionResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponseDto> getRiderSubscriptions(Long riderId) {
        return subscriptionRepository.findByRiderIdOrderByCreatedAtDesc(riderId).stream()
                .map(this::mapToSubscriptionResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponseDto> getDriverSubscriptions(Long driverId) {
        return subscriptionRepository.findByDriverIdOrderByCreatedAtDesc(driverId).stream()
                .map(this::mapToSubscriptionResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SubscriptionResponseDto> getAllSubscriptions() {
        return subscriptionRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToSubscriptionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SubscriptionResponseDto cancelSubscription(Long userId, Long subscriptionId) {
        RideSubscription subscription = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new RuntimeException("Subscription not found"));

        if (!subscription.getRider().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: Only the subscriber can cancel this subscription");
        }

        subscription.setStatus(SubscriptionStatus.CANCELLED);
        RideSubscription saved = subscriptionRepository.save(subscription);

        // Cancel remaining scheduled rides & refund unused escrow
        List<DailyScheduledRide> dailyRides = dailyScheduledRideRepository.findBySubscriptionIdOrderByTripDateAscScheduledTimeAsc(subscriptionId);
        double unfulfilledAmount = 0.0;
        for (DailyScheduledRide daily : dailyRides) {
            if (daily.getStatus() == DailyTripStatus.SCHEDULED || daily.getStatus() == DailyTripStatus.BUFFER_ACTIVE) {
                daily.setStatus(DailyTripStatus.CANCELLED);
                unfulfilledAmount += daily.getDailyFare();
            }
        }
        dailyScheduledRideRepository.saveAll(dailyRides);

        // Refund unused escrow balance to rider's wallet
        walletService.refundRemainingEscrow(userId, unfulfilledAmount, subscriptionId);

        return mapToSubscriptionResponse(saved);
    }

    public SubscriptionResponseDto mapToSubscriptionResponse(RideSubscription sub) {
        SubscriptionResponseDto dto = new SubscriptionResponseDto();
        dto.setId(sub.getId());
        dto.setRiderId(sub.getRider().getId());
        dto.setRiderName(sub.getRider().getName());
        dto.setRiderPhone(sub.getRider().getPhone());

        if (sub.getDriver() != null) {
            dto.setDriverId(sub.getDriver().getId());
            dto.setDriverName(sub.getDriver().getName());
            dto.setDriverPhone(sub.getDriver().getPhone());

            driverProfileRepository.findByUserId(sub.getDriver().getId()).ifPresent(p -> {
                dto.setVehicleNumber(p.getVehicleNumber());
                dto.setVehicleModel(p.getVehicleModel());
            });
        }

        dto.setVehicleType(sub.getVehicleType());
        dto.setSubscriptionType(sub.getSubscriptionType());
        dto.setStartDate(sub.getStartDate());
        dto.setEndDate(sub.getEndDate());
        dto.setTotalDays(sub.getTotalDays());

        List<DailyScheduledRide> dailyRides = dailyScheduledRideRepository.findBySubscriptionIdOrderByTripDateAscScheduledTimeAsc(sub.getId());
        dto.setTotalTrips(dailyRides.size());
        dto.setCompletedTrips((int) dailyRides.stream().filter(r -> r.getStatus() == DailyTripStatus.COMPLETED).count());

        dto.setPickupAddress(sub.getPickupAddress());
        dto.setPickupLat(sub.getPickupLat());
        dto.setPickupLng(sub.getPickupLng());
        dto.setDropoffAddress(sub.getDropoffAddress());
        dto.setDropoffLat(sub.getDropoffLat());
        dto.setDropoffLng(sub.getDropoffLng());
        dto.setOutwardTimeSlot(sub.getOutwardTimeSlot());
        dto.setReturnTimeSlot(sub.getReturnTimeSlot());
        dto.setDistanceKm(sub.getDistanceKm());
        dto.setPerRideFare(sub.getPerRideFare());
        dto.setDiscountPercentage(sub.getDiscountPercentage());
        dto.setTotalPackageCost(sub.getTotalPackageCost());
        dto.setEscrowAmountLocked(sub.getEscrowAmountLocked());
        dto.setStatus(sub.getStatus());
        dto.setRoutePolyline(sub.getRoutePolyline());
        dto.setCreatedAt(sub.getCreatedAt());

        dto.setDailyRides(dailyRides.stream().map(d -> {
            DailyScheduledRideDto dDto = new DailyScheduledRideDto();
            dDto.setId(d.getId());
            dDto.setSubscriptionId(sub.getId());
            dDto.setTripDate(d.getTripDate());
            dDto.setLeg(d.getLeg());
            dDto.setScheduledTime(d.getScheduledTime());
            if (d.getAssignedDriver() != null) {
                dDto.setAssignedDriverId(d.getAssignedDriver().getId());
                dDto.setAssignedDriverName(d.getAssignedDriver().getName());
            }
            dDto.setBackupDriver(d.isBackupDriver());
            if (d.getLinkedRide() != null) {
                dDto.setLinkedRideId(d.getLinkedRide().getId());
                dDto.setOtp(d.getLinkedRide().getOtp());
            }
            dDto.setStatus(d.getStatus());
            dDto.setDailyFare(d.getDailyFare());
            return dDto;
        }).collect(Collectors.toList()));

        return dto;
    }
}
