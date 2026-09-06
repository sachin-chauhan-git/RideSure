package com.ridehail.controller;

import com.ridehail.dto.DriverLocationDto;
import com.ridehail.service.DriverService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class RideWebSocketController {

    private final DriverService driverService;
    private final SimpMessagingTemplate messagingTemplate;

    public RideWebSocketController(DriverService driverService, SimpMessagingTemplate messagingTemplate) {
        this.driverService = driverService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/driver/location")
    public void handleDriverLocationUpdate(@Payload DriverLocationDto locationDto) {
        if (locationDto.getDriverId() != null && locationDto.getLat() != null && locationDto.getLng() != null) {
            driverService.updateLocation(
                    locationDto.getDriverId(),
                    locationDto.getLat(),
                    locationDto.getLng(),
                    locationDto.getHeading()
            );
        }
    }

    @MessageMapping("/ride/track")
    public void handleRideTracking(@Payload DriverLocationDto locationDto) {
        // Broadcasts to subscribers of specific ride updates
        messagingTemplate.convertAndSend("/topic/ride/live-location", locationDto);
    }
}
