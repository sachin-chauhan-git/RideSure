package com.ridehail.service;

import com.ridehail.dto.FareEstimateResponseDto;
import com.ridehail.dto.NearbyDriverDto;
import com.ridehail.model.VehicleType;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FareCalculationService {

    private final DriverLocationService driverLocationService;
    private final GoogleRoutesService googleRoutesService;

    // Base surge multiplier (could be dynamically adjusted per city/demand)
    private double currentSurgeMultiplier = 1.0;

    public FareCalculationService(DriverLocationService driverLocationService, GoogleRoutesService googleRoutesService) {
        this.driverLocationService = driverLocationService;
        this.googleRoutesService = googleRoutesService;
    }

    public FareEstimateResponseDto calculateEstimates(double pickupLat, double pickupLng, double dropoffLat, double dropoffLng) {
        GoogleRoutesService.RouteResult route = googleRoutesService.computeRoute(pickupLat, pickupLng, dropoffLat, dropoffLng);

        FareEstimateResponseDto response = new FareEstimateResponseDto();
        response.setDistanceKm(route.getDistanceKm());
        response.setDurationMinutes(route.getDurationMinutes());
        response.setRoutePolyline(route.getEncodedPolyline());

        List<FareEstimateResponseDto.TierEstimate> tiers = new ArrayList<>();

        for (VehicleType vehicleType : VehicleType.values()) {
            double fare = calculateFare(vehicleType, route.getDistanceKm(), route.getDurationMinutes(), currentSurgeMultiplier);

            // Find nearby driver to compute accurate ETA
            List<NearbyDriverDto> nearby = driverLocationService.findNearbyDrivers(pickupLat, pickupLng, 10.0, vehicleType);
            int etaMinutes = nearby.isEmpty() ? 4 : nearby.get(0).getEtaMinutes();

            tiers.add(new FareEstimateResponseDto.TierEstimate(
                    vehicleType,
                    vehicleType.getDisplayName(),
                    Math.round(fare * 100.0) / 100.0,
                    vehicleType.getCapacity(),
                    etaMinutes,
                    currentSurgeMultiplier
            ));
        }

        response.setTiers(tiers);
        return response;
    }

    public double calculateFare(VehicleType vehicleType, double distanceKm, int durationMinutes, double surgeMultiplier) {
        double rawFare = vehicleType.getBaseFare()
                + (distanceKm * vehicleType.getPerKmRate())
                + (durationMinutes * vehicleType.getPerMinuteRate());

        double total = Math.max(vehicleType.getBaseFare(), rawFare) * surgeMultiplier;
        return Math.round(total * 10.0) / 10.0;
    }

    public double getCurrentSurgeMultiplier() {
        return currentSurgeMultiplier;
    }

    public void setCurrentSurgeMultiplier(double currentSurgeMultiplier) {
        this.currentSurgeMultiplier = currentSurgeMultiplier;
    }
}
