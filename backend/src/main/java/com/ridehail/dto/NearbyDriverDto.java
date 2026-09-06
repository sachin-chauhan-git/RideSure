package com.ridehail.dto;

import com.ridehail.model.VehicleType;

public class NearbyDriverDto {
    private Long driverId;
    private Double lat;
    private Double lng;
    private VehicleType vehicleType;
    private Double distanceKm;
    private Integer etaMinutes;

    public NearbyDriverDto() {}

    public NearbyDriverDto(Long driverId, Double lat, Double lng, VehicleType vehicleType, Double distanceKm, Integer etaMinutes) {
        this.driverId = driverId;
        this.lat = lat;
        this.lng = lng;
        this.vehicleType = vehicleType;
        this.distanceKm = distanceKm;
        this.etaMinutes = etaMinutes;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public Double getLat() {
        return lat;
    }

    public void setLat(Double lat) {
        this.lat = lat;
    }

    public Double getLng() {
        return lng;
    }

    public void setLng(Double lng) {
        this.lng = lng;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Integer getEtaMinutes() {
        return etaMinutes;
    }

    public void setEtaMinutes(Integer etaMinutes) {
        this.etaMinutes = etaMinutes;
    }
}
