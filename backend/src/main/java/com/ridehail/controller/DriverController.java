package com.ridehail.controller;

import com.ridehail.dto.*;
import com.ridehail.security.CustomUserDetails;
import com.ridehail.service.DriverService;
import com.ridehail.service.RideService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/drivers")
public class DriverController {

    private final DriverService driverService;
    private final RideService rideService;

    public DriverController(DriverService driverService, RideService rideService) {
        this.driverService = driverService;
        this.rideService = rideService;
    }

    @GetMapping("/me")
    public ResponseEntity<DriverProfileDto> getMyProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ResponseEntity.ok(driverService.getDriverProfile(userDetails.getId()));
    }

    @PostMapping("/status")
    public ResponseEntity<DriverProfileDto> toggleStatus(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam boolean online,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng
    ) {
        return ResponseEntity.ok(driverService.toggleOnlineStatus(userDetails.getId(), online, lat, lng));
    }

    @PostMapping("/location")
    public ResponseEntity<Void> updateLocation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody DriverLocationDto locationDto
    ) {
        driverService.updateLocation(userDetails.getId(), locationDto.getLat(), locationDto.getLng(), locationDto.getHeading());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/active-ride")
    public ResponseEntity<RideResponseDto> getActiveRide(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return rideService.getActiveRideForDriver(userDetails.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/rides/{id}/accept")
    public ResponseEntity<RideResponseDto> acceptRide(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(rideService.acceptRide(userDetails.getId(), id));
    }

    @PostMapping("/rides/{id}/arrived")
    public ResponseEntity<RideResponseDto> markArrived(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(rideService.markDriverArrived(userDetails.getId(), id));
    }

    @PostMapping("/rides/{id}/start")
    public ResponseEntity<RideResponseDto> startRide(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @RequestParam String otp
    ) {
        return ResponseEntity.ok(rideService.startRide(userDetails.getId(), id, otp));
    }

    @PostMapping("/rides/{id}/complete")
    public ResponseEntity<RideResponseDto> completeRide(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(rideService.completeRide(userDetails.getId(), id));
    }
}
