package com.ridehail.repository;

import com.ridehail.model.DailyScheduledRide;
import com.ridehail.model.DailyTripStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyScheduledRideRepository extends JpaRepository<DailyScheduledRide, Long> {
    List<DailyScheduledRide> findBySubscriptionIdOrderByTripDateAscScheduledTimeAsc(Long subscriptionId);
    List<DailyScheduledRide> findByTripDateAndStatus(LocalDate tripDate, DailyTripStatus status);
    
    @Query("SELECT d FROM DailyScheduledRide d WHERE d.tripDate = :tripDate AND d.status = :status AND d.scheduledTime BETWEEN :startTime AND :endTime")
    List<DailyScheduledRide> findUpcomingScheduledRides(LocalDate tripDate, DailyTripStatus status, LocalTime startTime, LocalTime endTime);

    @Query("SELECT d FROM DailyScheduledRide d WHERE d.assignedDriver.id = :driverId AND d.tripDate = :tripDate AND d.status IN ('SCHEDULED', 'BUFFER_ACTIVE', 'DISPATCHED')")
    List<DailyScheduledRide> findDriverCommittedRidesToday(Long driverId, LocalDate tripDate);

    Optional<DailyScheduledRide> findByLinkedRideId(Long linkedRideId);
}
