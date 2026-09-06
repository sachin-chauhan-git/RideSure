package com.ridehail.controller;

import com.ridehail.dto.*;
import com.ridehail.model.VehicleType;
import com.ridehail.security.CustomUserDetails;
import com.ridehail.service.DriverLocationService;
import com.ridehail.service.FareCalculationService;
import com.ridehail.service.RideService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rides")
public class RideController {

    private final RideService rideService;
    private final FareCalculationService fareCalculationService;
    private final DriverLocationService driverLocationService;

    public RideController(
            RideService rideService,
            FareCalculationService fareCalculationService,
            DriverLocationService driverLocationService
    ) {
        this.rideService = rideService;
        this.fareCalculationService = fareCalculationService;
        this.driverLocationService = driverLocationService;
    }

    @PostMapping("/estimate")
    public ResponseEntity<FareEstimateResponseDto> estimateFare(@RequestBody FareEstimateRequestDto request) {
        return ResponseEntity.ok(fareCalculationService.calculateEstimates(
                request.getPickupLat(),
                request.getPickupLng(),
                request.getDropoffLat(),
                request.getDropoffLng()
        ));
    }

    @PostMapping("/request")
    public ResponseEntity<RideResponseDto> requestRide(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody RideRequestDto request
    ) {
        return ResponseEntity.ok(rideService.requestRide(userDetails.getId(), request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RideResponseDto> getRide(@PathVariable Long id) {
        return ResponseEntity.ok(rideService.getRideById(id));
    }

    @GetMapping("/active")
    public ResponseEntity<RideResponseDto> getActiveRide(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return rideService.getActiveRideForRider(userDetails.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<RideResponseDto> cancelRide(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Cancelled by rider") String reason
    ) {
        return ResponseEntity.ok(rideService.cancelRide(userDetails.getId(), id, reason));
    }

    @GetMapping("/nearby-drivers")
    public ResponseEntity<List<NearbyDriverDto>> getNearbyDrivers(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(required = false, defaultValue = "10.0") Double radiusKm,
            @RequestParam(required = false) VehicleType vehicleType
    ) {
        return ResponseEntity.ok(driverLocationService.findNearbyDrivers(lat, lng, radiusKm, vehicleType));
    }
}
