package com.ridehail.controller;

import com.ridehail.dto.DriverProfileDto;
import com.ridehail.dto.RideResponseDto;
import com.ridehail.model.Role;
import com.ridehail.repository.DriverProfileRepository;
import com.ridehail.repository.RideRepository;
import com.ridehail.repository.UserRepository;
import com.ridehail.service.DriverService;
import com.ridehail.service.FareCalculationService;
import com.ridehail.service.RideService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final RideService rideService;
    private final DriverService driverService;
    private final FareCalculationService fareCalculationService;
    private final UserRepository userRepository;
    private final RideRepository rideRepository;
    private final DriverProfileRepository driverProfileRepository;

    public AdminController(
            RideService rideService,
            DriverService driverService,
            FareCalculationService fareCalculationService,
            UserRepository userRepository,
            RideRepository rideRepository,
            DriverProfileRepository driverProfileRepository
    ) {
        this.rideService = rideService;
        this.driverService = driverService;
        this.fareCalculationService = fareCalculationService;
        this.userRepository = userRepository;
        this.rideRepository = rideRepository;
        this.driverProfileRepository = driverProfileRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", userRepository.count());
        stats.put("totalRiders", userRepository.findByRole(Role.ROLE_RIDER).size());
        stats.put("totalDrivers", userRepository.findByRole(Role.ROLE_DRIVER).size());
        stats.put("onlineDrivers", driverProfileRepository.findByIsOnlineTrueAndIsBusyFalse().size());
        stats.put("totalRides", rideRepository.count());
        stats.put("currentSurge", fareCalculationService.getCurrentSurgeMultiplier());
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/drivers")
    public ResponseEntity<List<DriverProfileDto>> getAllDrivers() {
        return ResponseEntity.ok(driverService.getAllDrivers());
    }

    @GetMapping("/rides")
    public ResponseEntity<List<RideResponseDto>> getAllRides() {
        return ResponseEntity.ok(rideService.getAllRides());
    }

    @PostMapping("/surge")
    public ResponseEntity<Map<String, Object>> setSurgeMultiplier(@RequestParam double multiplier) {
        fareCalculationService.setCurrentSurgeMultiplier(multiplier);
        return ResponseEntity.ok(Map.of("surgeMultiplier", multiplier, "status", "updated"));
    }
}
