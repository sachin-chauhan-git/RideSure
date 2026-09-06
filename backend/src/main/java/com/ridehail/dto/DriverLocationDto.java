package com.ridehail.dto;

import com.ridehail.model.VehicleType;

public class DriverLocationDto {
    private Long driverId;
    private Double lat;
    private Double lng;
    private VehicleType vehicleType;
    private Double heading;

    public DriverLocationDto() {}

    public DriverLocationDto(Long driverId, Double lat, Double lng, VehicleType vehicleType, Double heading) {
        this.driverId = driverId;
        this.lat = lat;
        this.lng = lng;
        this.vehicleType = vehicleType;
        this.heading = heading;
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

    public Double getHeading() {
        return heading;
    }

    public void setHeading(Double heading) {
        this.heading = heading;
    }
}
