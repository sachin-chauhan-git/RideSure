package com.ridehail.service;

import com.ridehail.dto.*;
import com.ridehail.model.*;
import com.ridehail.repository.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RideService {

    private final RideRepository rideRepository;
    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final TransactionRepository transactionRepository;
    private final DailyScheduledRideRepository dailyScheduledRideRepository;
    private final WalletService walletService;
    private final DriverLocationService driverLocationService;
    private final FareCalculationService fareCalculationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    public RideService(
            RideRepository rideRepository,
            UserRepository userRepository,
            DriverProfileRepository driverProfileRepository,
            TransactionRepository transactionRepository,
            DailyScheduledRideRepository dailyScheduledRideRepository,
            WalletService walletService,
            DriverLocationService driverLocationService,
            FareCalculationService fareCalculationService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.rideRepository = rideRepository;
        this.userRepository = userRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.transactionRepository = transactionRepository;
        this.dailyScheduledRideRepository = dailyScheduledRideRepository;
        this.walletService = walletService;
        this.driverLocationService = driverLocationService;
        this.fareCalculationService = fareCalculationService;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional
    public RideResponseDto requestRide(Long riderId, RideRequestDto requestDto) {
        User rider = userRepository.findById(riderId)
                .orElseThrow(() -> new RuntimeException("Rider not found with id: " + riderId));

        // Generate 4-digit OTP for ride start verification
        String otp = String.format("%04d", secureRandom.nextInt(10000));

        Ride ride = new Ride();
        ride.setRider(rider);
        ride.setVehicleType(requestDto.getVehicleType());
        ride.setStatus(RideStatus.SEARCHING);
        ride.setPickupAddress(requestDto.getPickupAddress());
        ride.setPickupLat(requestDto.getPickupLat());
        ride.setPickupLng(requestDto.getPickupLng());
        ride.setDropoffAddress(requestDto.getDropoffAddress());
        ride.setDropoffLat(requestDto.getDropoffLat());
        ride.setDropoffLng(requestDto.getDropoffLng());
        ride.setDistanceKm(requestDto.getDistanceKm());
        ride.setDurationMinutes(requestDto.getDurationMinutes());
        ride.setEstimatedFare(requestDto.getEstimatedFare());
        ride.setOtp(otp);
        ride.setRoutePolyline(requestDto.getRoutePolyline());
        ride.setCreatedAt(LocalDateTime.now());

        Ride savedRide = rideRepository.save(ride);
        RideResponseDto responseDto = mapToRideResponse(savedRide);

        // Find nearby drivers via Redis / Geo Engine and notify them
        List<NearbyDriverDto> nearbyDrivers = driverLocationService.findNearbyDrivers(
                requestDto.getPickupLat(),
                requestDto.getPickupLng(),
                10.0,
                requestDto.getVehicleType()
        );

        // Broadcast dispatch request to nearby drivers
        for (NearbyDriverDto driver : nearbyDrivers) {
            messagingTemplate.convertAndSend("/topic/driver/" + driver.getDriverId() + "/requests", responseDto);
        }
        // Also broadcast to general dispatch topic for active online drivers
        messagingTemplate.convertAndSend("/topic/dispatches/" + requestDto.getVehicleType().name(), responseDto);

        return responseDto;
    }

    @Transactional
    public RideResponseDto acceptRide(Long driverId, Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found with id: " + rideId));

        if (ride.getStatus() != RideStatus.REQUESTED && ride.getStatus() != RideStatus.SEARCHING) {
            throw new RuntimeException("Ride is no longer available (current status: " + ride.getStatus() + ")");
        }

        User driverUser = userRepository.findById(driverId)
                .orElseThrow(() -> new RuntimeException("Driver user not found with id: " + driverId));

        DriverProfile profile = driverProfileRepository.findByUserId(driverId)
                .orElseThrow(() -> new RuntimeException("Driver profile not found for user: " + driverId));

        profile.setBusy(true);
        driverProfileRepository.save(profile);
        driverLocationService.removeDriverFromAvailable(driverId, profile.getVehicleType());

        ride.setDriver(driverUser);
        ride.setStatus(RideStatus.ACCEPTED);
        Ride updatedRide = rideRepository.save(ride);

        RideResponseDto responseDto = mapToRideResponse(updatedRide);

        // Notify Rider and Driver over STOMP WebSocket
        messagingTemplate.convertAndSend("/topic/ride/" + rideId, responseDto);
        messagingTemplate.convertAndSend("/topic/rider/" + ride.getRider().getId() + "/ride", responseDto);

        return responseDto;
    }

    @Transactional
    public RideResponseDto markDriverArrived(Long driverId, Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (!ride.getDriver().getId().equals(driverId)) {
            throw new RuntimeException("Unauthorized: Driver does not own this ride");
        }

        ride.setStatus(RideStatus.ARRIVED_AT_PICKUP);
        Ride updatedRide = rideRepository.save(ride);

        RideResponseDto responseDto = mapToRideResponse(updatedRide);
        messagingTemplate.convertAndSend("/topic/ride/" + rideId, responseDto);
        return responseDto;
    }

    @Transactional
    public RideResponseDto startRide(Long driverId, Long rideId, String otp) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (!ride.getDriver().getId().equals(driverId)) {
            throw new RuntimeException("Unauthorized: Driver does not own this ride");
        }

        if (otp == null || !otp.trim().equals(ride.getOtp())) {
            throw new RuntimeException("Invalid Ride Start OTP. Please enter the 4-digit code given by the rider.");
        }

        ride.setStatus(RideStatus.IN_TRANSIT);
        ride.setStartedAt(LocalDateTime.now());
        Ride updatedRide = rideRepository.save(ride);

        RideResponseDto responseDto = mapToRideResponse(updatedRide);
        messagingTemplate.convertAndSend("/topic/ride/" + rideId, responseDto);
        return responseDto;
    }

    @Transactional
    public RideResponseDto completeRide(Long driverId, Long rideId) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        if (!ride.getDriver().getId().equals(driverId)) {
            throw new RuntimeException("Unauthorized: Driver does not own this ride");
        }

        ride.setStatus(RideStatus.COMPLETED);
        ride.setFinalFare(ride.getEstimatedFare());
        ride.setCompletedAt(LocalDateTime.now());
        Ride updatedRide = rideRepository.save(ride);

        // Update driver stats & free up
        DriverProfile profile = driverProfileRepository.findByUserId(driverId).orElse(null);
        if (profile != null) {
            profile.setBusy(false);
            profile.setTotalTrips(profile.getTotalTrips() + 1);
            driverProfileRepository.save(profile);
            if (profile.isOnline()) {
                driverLocationService.updateDriverLocation(
                        driverId,
                        profile.getCurrentLat() != null ? profile.getCurrentLat() : ride.getDropoffLat(),
                        profile.getCurrentLng() != null ? profile.getCurrentLng() : ride.getDropoffLng(),
                        profile.getVehicleType(),
                        0.0
                );
            }
        }

        // Record successful transaction
        Transaction transaction = new Transaction(
                updatedRide,
                updatedRide.getFinalFare(),
                PaymentMethod.CASH,
                PaymentStatus.COMPLETED,
                "TXN-" + System.currentTimeMillis()
        );
        transactionRepository.save(transaction);

        // Check if this ride was a Subscription Daily Commute
        dailyScheduledRideRepository.findByLinkedRideId(rideId).ifPresent(daily -> {
            daily.setStatus(DailyTripStatus.COMPLETED);
            dailyScheduledRideRepository.save(daily);
            // Settle wallet payment: Deduct from rider escrow & credit driver
            walletService.settleDailySubscriptionTrip(
                    daily.getSubscription().getRider().getId(),
                    driverId,
                    daily.getDailyFare(),
                    daily.getSubscription().getId()
            );
        });

        RideResponseDto responseDto = mapToRideResponse(updatedRide);
        messagingTemplate.convertAndSend("/topic/ride/" + rideId, responseDto);
        return responseDto;
    }

    @Transactional
    public RideResponseDto cancelRide(Long userId, Long rideId, String reason) {
        Ride ride = rideRepository.findById(rideId)
                .orElseThrow(() -> new RuntimeException("Ride not found"));

        ride.setStatus(RideStatus.CANCELLED);
        Ride updatedRide = rideRepository.save(ride);

        // Free up driver if assigned
        if (ride.getDriver() != null) {
            driverProfileRepository.findByUserId(ride.getDriver().getId()).ifPresent(profile -> {
                profile.setBusy(false);
                driverProfileRepository.save(profile);
            });
        }

        RideResponseDto responseDto = mapToRideResponse(updatedRide);
        messagingTemplate.convertAndSend("/topic/ride/" + rideId, responseDto);
        return responseDto;
    }

    public Optional<RideResponseDto> getActiveRideForRider(Long riderId) {
        return rideRepository.findActiveRideForRider(riderId).map(this::mapToRideResponse);
    }

    public Optional<RideResponseDto> getActiveRideForDriver(Long driverId) {
        return rideRepository.findActiveRideForDriver(driverId).map(this::mapToRideResponse);
    }

    public RideResponseDto getRideById(Long rideId) {
        return rideRepository.findById(rideId)
                .map(this::mapToRideResponse)
                .orElseThrow(() -> new RuntimeException("Ride not found"));
    }

    public List<RideResponseDto> getAllRides() {
        return rideRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::mapToRideResponse)
                .collect(Collectors.toList());
    }

    public RideResponseDto mapToRideResponse(Ride ride) {
        RideResponseDto dto = new RideResponseDto();
        dto.setId(ride.getId());
        dto.setRiderId(ride.getRider().getId());
        dto.setRiderName(ride.getRider().getName());
        dto.setRiderPhone(ride.getRider().getPhone());

        if (ride.getDriver() != null) {
            dto.setDriverId(ride.getDriver().getId());
            dto.setDriverName(ride.getDriver().getName());
            dto.setDriverPhone(ride.getDriver().getPhone());

            driverProfileRepository.findByUserId(ride.getDriver().getId()).ifPresent(profile -> {
                dto.setVehicleNumber(profile.getVehicleNumber());
                dto.setVehicleModel(profile.getVehicleModel());
                dto.setDriverLat(profile.getCurrentLat());
                dto.setDriverLng(profile.getCurrentLng());
                dto.setDriverRating(profile.getRatingAvg());
            });
        }

        dto.setVehicleType(ride.getVehicleType());
        dto.setStatus(ride.getStatus());
        dto.setPickupAddress(ride.getPickupAddress());
        dto.setPickupLat(ride.getPickupLat());
        dto.setPickupLng(ride.getPickupLng());
        dto.setDropoffAddress(ride.getDropoffAddress());
        dto.setDropoffLat(ride.getDropoffLat());
        dto.setDropoffLng(ride.getDropoffLng());
        dto.setDistanceKm(ride.getDistanceKm());
        dto.setDurationMinutes(ride.getDurationMinutes());
        dto.setEstimatedFare(ride.getEstimatedFare());
        dto.setFinalFare(ride.getFinalFare());
        dto.setOtp(ride.getOtp());
        dto.setRoutePolyline(ride.getRoutePolyline());
        dto.setCreatedAt(ride.getCreatedAt());
        dto.setStartedAt(ride.getStartedAt());
        dto.setCompletedAt(ride.getCompletedAt());

        return dto;
    }
}
