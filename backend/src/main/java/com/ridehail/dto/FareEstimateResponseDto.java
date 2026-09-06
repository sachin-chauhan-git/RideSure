package com.ridehail.dto;

import com.ridehail.model.VehicleType;
import java.util.List;

public class FareEstimateResponseDto {
    private Double distanceKm;
    private Integer durationMinutes;
    private String routePolyline;
    private List<TierEstimate> tiers;

    public static class TierEstimate {
        private VehicleType vehicleType;
        private String displayName;
        private Double fare;
        private Integer capacity;
        private Integer etaMinutes;
        private Double surgeMultiplier;

        public TierEstimate() {}

        public TierEstimate(VehicleType vehicleType, String displayName, Double fare, Integer capacity, Integer etaMinutes, Double surgeMultiplier) {
            this.vehicleType = vehicleType;
            this.displayName = displayName;
            this.fare = fare;
            this.capacity = capacity;
            this.etaMinutes = etaMinutes;
            this.surgeMultiplier = surgeMultiplier;
        }

        public VehicleType getVehicleType() {
            return vehicleType;
        }

        public void setVehicleType(VehicleType vehicleType) {
            this.vehicleType = vehicleType;
        }

        public String getDisplayName() {
            return displayName;
        }

        public void setDisplayName(String displayName) {
            this.displayName = displayName;
        }

        public Double getFare() {
            return fare;
        }

        public void setFare(Double fare) {
            this.fare = fare;
        }

        public Integer getCapacity() {
            return capacity;
        }

        public void setCapacity(Integer capacity) {
            this.capacity = capacity;
        }

        public Integer getEtaMinutes() {
            return etaMinutes;
        }

        public void setEtaMinutes(Integer etaMinutes) {
            this.etaMinutes = etaMinutes;
        }

        public Double getSurgeMultiplier() {
            return surgeMultiplier;
        }

        public void setSurgeMultiplier(Double surgeMultiplier) {
            this.surgeMultiplier = surgeMultiplier;
        }
    }

    public FareEstimateResponseDto() {}

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public String getRoutePolyline() {
        return routePolyline;
    }

    public void setRoutePolyline(String routePolyline) {
        this.routePolyline = routePolyline;
    }

    public List<TierEstimate> getTiers() {
        return tiers;
    }

    public void setTiers(List<TierEstimate> tiers) {
        this.tiers = tiers;
    }
}
