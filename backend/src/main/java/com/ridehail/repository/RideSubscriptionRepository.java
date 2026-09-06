package com.ridehail.repository;

import com.ridehail.model.RideSubscription;
import com.ridehail.model.SubscriptionStatus;
import com.ridehail.model.User;
import com.ridehail.model.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideSubscriptionRepository extends JpaRepository<RideSubscription, Long> {
    List<RideSubscription> findByRiderOrderByCreatedAtDesc(User rider);
    List<RideSubscription> findByRiderIdOrderByCreatedAtDesc(Long riderId);
    List<RideSubscription> findByDriverOrderByCreatedAtDesc(User driver);
    List<RideSubscription> findByDriverIdOrderByCreatedAtDesc(Long driverId);
    List<RideSubscription> findByStatus(SubscriptionStatus status);
    List<RideSubscription> findByStatusAndVehicleType(SubscriptionStatus status, VehicleType vehicleType);
    List<RideSubscription> findAllByOrderByCreatedAtDesc();
}
