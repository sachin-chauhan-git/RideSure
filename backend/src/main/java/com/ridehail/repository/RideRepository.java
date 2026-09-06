package com.ridehail.repository;

import com.ridehail.model.Ride;
import com.ridehail.model.RideStatus;
import com.ridehail.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long> {
    List<Ride> findByRiderOrderByCreatedAtDesc(User rider);
    List<Ride> findByDriverOrderByCreatedAtDesc(User driver);
    List<Ride> findByStatusOrderByCreatedAtDesc(RideStatus status);
    
    @Query("SELECT r FROM Ride r WHERE r.rider.id = :riderId AND r.status IN ('REQUESTED', 'SEARCHING', 'ACCEPTED', 'ARRIVED_AT_PICKUP', 'IN_TRANSIT') ORDER BY r.createdAt DESC")
    Optional<Ride> findActiveRideForRider(Long riderId);

    @Query("SELECT r FROM Ride r WHERE r.driver.id = :driverId AND r.status IN ('ACCEPTED', 'ARRIVED_AT_PICKUP', 'IN_TRANSIT') ORDER BY r.createdAt DESC")
    Optional<Ride> findActiveRideForDriver(Long driverId);

    List<Ride> findAllByOrderByCreatedAtDesc();
}
