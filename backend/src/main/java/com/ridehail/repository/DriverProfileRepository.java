package com.ridehail.repository;

import com.ridehail.model.DriverProfile;
import com.ridehail.model.User;
import com.ridehail.model.VehicleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DriverProfileRepository extends JpaRepository<DriverProfile, Long> {
    Optional<DriverProfile> findByUser(User user);
    Optional<DriverProfile> findByUserId(Long userId);
    List<DriverProfile> findByIsOnlineTrueAndIsBusyFalse();
    List<DriverProfile> findByIsOnlineTrueAndIsBusyFalseAndVehicleType(VehicleType vehicleType);
    boolean existsByVehicleNumber(String vehicleNumber);
}
