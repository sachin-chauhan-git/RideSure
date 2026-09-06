package com.ridehail.service;

import com.ridehail.dto.NearbyDriverDto;
import com.ridehail.dto.RideResponseDto;
import com.ridehail.model.*;
import com.ridehail.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@EnableScheduling
public class SubscriptionSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(SubscriptionSchedulerService.class);

    private final DailyScheduledRideRepository dailyScheduledRideRepository;
    private final RideRepository rideRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final DriverLocationService driverLocationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    public SubscriptionSchedulerService(
            DailyScheduledRideRepository dailyScheduledRideRepository,
            RideRepository rideRepository,
            DriverProfileRepository driverProfileRepository,
            DriverLocationService driverLocationService,
            SimpMessagingTemplate messagingTemplate
    ) {
        this.dailyScheduledRideRepository = dailyScheduledRideRepository;
        this.rideRepository = rideRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.driverLocationService = driverLocationService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Runs every minute to manage upcoming daily commute trips:
     * 1. T - 20 mins: 20-min Driver Buffer lock
     * 2. T - 15 mins: Create & Dispatch Today's Ride with 4-Digit OTP
     * 3. T - 10 mins: Option A Emergency Backup Driver Fallback
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processUpcomingCommutes() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        // 1. T - 20 Minutes: Activate 20-Minute Driver Buffer
        LocalTime bufferWindow = now.plusMinutes(20);
        List<DailyScheduledRide> bufferRides = dailyScheduledRideRepository.findUpcomingScheduledRides(
                today,
                DailyTripStatus.SCHEDULED,
                now,
                bufferWindow
        );

        for (DailyScheduledRide daily : bufferRides) {
            daily.setStatus(DailyTripStatus.BUFFER_ACTIVE);
            dailyScheduledRideRepository.save(daily);

            if (daily.getAssignedDriver() != null) {
                logger.info("Activated 20-min buffer lock for Driver #{} on Commute Ride #{}", daily.getAssignedDriver().getId(), daily.getId());
                // Alert driver of upcoming scheduled pickup
                messagingTemplate.convertAndSend(
                        "/topic/driver/" + daily.getAssignedDriver().getId() + "/commute-buffer",
                        "20-Min Buffer Active: Prepare for scheduled commute pickup at " + daily.getScheduledTime()
                );
            }
        }

        // 2. T - 15 Minutes: Dispatch Ride with 4-Digit OTP
        LocalTime dispatchWindow = now.plusMinutes(15);
        List<DailyScheduledRide> dispatchRides = dailyScheduledRideRepository.findUpcomingScheduledRides(
                today,
                DailyTripStatus.BUFFER_ACTIVE,
                now,
                dispatchWindow
        );

        for (DailyScheduledRide daily : dispatchRides) {
            dispatchTodayCommute(daily);
        }

        // 3. T - 10 Minutes: Emergency Fallback Engine (Option A)
        // If assigned driver is offline or unavailable 10 mins before slot, auto-assign backup driver
        LocalTime emergencyWindow = now.plusMinutes(10);
        List<DailyScheduledRide> emergencyCheckRides = dailyScheduledRideRepository.findUpcomingScheduledRides(
                today,
                DailyTripStatus.DISPATCHED,
                now,
                emergencyWindow
        );

        for (DailyScheduledRide daily : emergencyCheckRides) {
            if (daily.getAssignedDriver() != null && !daily.isBackupDriver()) {
                Optional<DriverProfile> driverProf = driverProfileRepository.findByUserId(daily.getAssignedDriver().getId());
                boolean isDriverOffline = driverProf.isEmpty() || !driverProf.get().isOnline();

                if (isDriverOffline) {
                    logger.warn("Primary driver #{} is offline 10 mins before commute. Triggering Option A Backup Fallback!", daily.getAssignedDriver().getId());
                    triggerBackupDriver(daily);
                }
            }
        }
    }

    /**
     * Dispatch today's commute trip instance (also callable on-demand for testing)
     */
    @Transactional
    public Ride dispatchTodayCommute(DailyScheduledRide daily) {
        if (daily.getLinkedRide() != null) {
            return daily.getLinkedRide();
        }

        RideSubscription sub = daily.getSubscription();
        String otp = String.format("%04d", secureRandom.nextInt(10000));

        // Determine pickup and dropoff coordinates based on OUTWARD or RETURN leg
        boolean isOutward = daily.getLeg() == TripLeg.OUTWARD;
        String pickupAddr = isOutward ? sub.getPickupAddress() : sub.getDropoffAddress();
        Double pickupLat = isOutward ? sub.getPickupLat() : sub.getDropoffLat();
        Double pickupLng = isOutward ? sub.getPickupLng() : sub.getDropoffLng();
        String dropoffAddr = isOutward ? sub.getDropoffAddress() : sub.getPickupAddress();
        Double dropoffLat = isOutward ? sub.getDropoffLat() : sub.getPickupLat();
        Double dropoffLng = isOutward ? sub.getDropoffLng() : sub.getPickupLng();

        Ride ride = new Ride();
        ride.setRider(sub.getRider());
        ride.setDriver(daily.getAssignedDriver() != null ? daily.getAssignedDriver() : sub.getDriver());
        ride.setVehicleType(sub.getVehicleType());
        ride.setStatus(ride.getDriver() != null ? RideStatus.ACCEPTED : RideStatus.SEARCHING);
        ride.setPickupAddress(pickupAddr);
        ride.setPickupLat(pickupLat);
        ride.setPickupLng(pickupLng);
        ride.setDropoffAddress(dropoffAddr);
        ride.setDropoffLat(dropoffLat);
        ride.setDropoffLng(dropoffLng);
        ride.setDistanceKm(sub.getDistanceKm());
        ride.setDurationMinutes((int) Math.round((sub.getDistanceKm() / 25.0) * 60));
        ride.setEstimatedFare(daily.getDailyFare());
        ride.setOtp(otp);
        ride.setRoutePolyline(sub.getRoutePolyline());
        ride.setCreatedAt(LocalDateTime.now());

        Ride savedRide = rideRepository.save(ride);
        daily.setLinkedRide(savedRide);
        daily.setStatus(DailyTripStatus.DISPATCHED);
        dailyScheduledRideRepository.save(daily);

        // Notify Rider & Driver over WebSockets
        messagingTemplate.convertAndSend("/topic/rider/" + sub.getRider().getId() + "/commute-dispatched", daily.getId());
        if (ride.getDriver() != null) {
            messagingTemplate.convertAndSend("/topic/driver/" + ride.getDriver().getId() + "/commute-dispatched", daily.getId());
        }

        return savedRide;
    }

    /**
     * Option A: Instant emergency backup driver search
     */
    @Transactional
    public void triggerBackupDriver(DailyScheduledRide daily) {
        RideSubscription sub = daily.getSubscription();
        List<NearbyDriverDto> backups = driverLocationService.findNearbyDrivers(
                sub.getPickupLat(),
                sub.getPickupLng(),
                15.0,
                sub.getVehicleType()
        );

        if (!backups.isEmpty()) {
            NearbyDriverDto backup = backups.get(0);
            Optional<DriverProfile> backupProfile = driverProfileRepository.findByUserId(backup.getDriverId());
            if (backupProfile.isPresent()) {
                User backupDriver = backupProfile.get().getUser();
                daily.setAssignedDriver(backupDriver);
                daily.setBackupDriver(true);
                daily.setStatus(DailyTripStatus.BACKUP_DISPATCHED);

                if (daily.getLinkedRide() != null) {
                    daily.getLinkedRide().setDriver(backupDriver);
                    rideRepository.save(daily.getLinkedRide());
                }
                dailyScheduledRideRepository.save(daily);

                logger.info("Emergency backup driver #{} assigned to commute trip #{}", backupDriver.getId(), daily.getId());
                messagingTemplate.convertAndSend("/topic/driver/" + backupDriver.getId() + "/emergency-commute", daily.getId());
                messagingTemplate.convertAndSend("/topic/rider/" + sub.getRider().getId() + "/commute-backup-assigned", backupDriver.getName());
            }
        }
    }
}
