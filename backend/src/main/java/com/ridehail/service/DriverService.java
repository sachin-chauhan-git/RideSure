package com.ridehail.service;

import com.ridehail.dto.DriverLocationDto;
import com.ridehail.dto.DriverProfileDto;
import com.ridehail.model.DriverProfile;
import com.ridehail.repository.DriverProfileRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DriverService {

    private final DriverProfileRepository driverProfileRepository;
    private final DriverLocationService driverLocationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuthService authService;

    public DriverService(
            DriverProfileRepository driverProfileRepository,
            DriverLocationService driverLocationService,
            SimpMessagingTemplate messagingTemplate,
            AuthService authService
    ) {
        this.driverProfileRepository = driverProfileRepository;
        this.driverLocationService = driverLocationService;
        this.messagingTemplate = messagingTemplate;
        this.authService = authService;
    }

    @Transactional
    public DriverProfileDto toggleOnlineStatus(Long driverId, boolean isOnline, Double lat, Double lng) {
        DriverProfile profile = driverProfileRepository.findByUserId(driverId)
                .orElseThrow(() -> new RuntimeException("Driver profile not found for user: " + driverId));

        profile.setOnline(isOnline);
        if (lat != null && lng != null) {
            profile.setCurrentLat(lat);
            profile.setCurrentLng(lng);
        }
        DriverProfile saved = driverProfileRepository.save(profile);

        if (isOnline && lat != null && lng != null) {
            driverLocationService.updateDriverLocation(driverId, lat, lng, profile.getVehicleType(), 0.0);
            broadcastDriverPosition(driverId, lat, lng, profile.getVehicleType(), 0.0);
        } else if (!isOnline) {
            driverLocationService.removeDriverFromAvailable(driverId, profile.getVehicleType());
        }

        return authService.mapToDriverDto(saved);
    }

    @Transactional
    public void updateLocation(Long driverId, Double lat, Double lng, Double heading) {
        DriverProfile profile = driverProfileRepository.findByUserId(driverId)
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));

        profile.setCurrentLat(lat);
        profile.setCurrentLng(lng);
        driverProfileRepository.save(profile);

        if (profile.isOnline() && !profile.isBusy()) {
            driverLocationService.updateDriverLocation(driverId, lat, lng, profile.getVehicleType(), heading);
        }

        broadcastDriverPosition(driverId, lat, lng, profile.getVehicleType(), heading);
    }

    private void broadcastDriverPosition(Long driverId, Double lat, Double lng, com.ridehail.model.VehicleType vehicleType, Double heading) {
        DriverLocationDto locationDto = new DriverLocationDto(driverId, lat, lng, vehicleType, heading);
        messagingTemplate.convertAndSend("/topic/drivers/locations", locationDto);
        messagingTemplate.convertAndSend("/topic/driver/" + driverId + "/location", locationDto);
    }

    public DriverProfileDto getDriverProfile(Long driverId) {
        DriverProfile profile = driverProfileRepository.findByUserId(driverId)
                .orElseThrow(() -> new RuntimeException("Driver profile not found"));
        return authService.mapToDriverDto(profile);
    }

    public List<DriverProfileDto> getActiveDrivers() {
        return driverProfileRepository.findByIsOnlineTrueAndIsBusyFalse().stream()
                .map(authService::mapToDriverDto)
                .collect(Collectors.toList());
    }

    public List<DriverProfileDto> getAllDrivers() {
        return driverProfileRepository.findAll().stream()
                .map(authService::mapToDriverDto)
                .collect(Collectors.toList());
    }
}
