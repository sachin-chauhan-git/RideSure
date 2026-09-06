package com.ridehail.dto;

import com.ridehail.model.SubscriptionType;
import com.ridehail.model.VehicleType;
import java.time.LocalDate;
import java.time.LocalTime;

public class CreateSubscriptionRequestDto {
    private VehicleType vehicleType;
    private SubscriptionType subscriptionType; // ONE_WAY or ROUND_TRIP
    private LocalDate startDate;
    private LocalDate endDate;
    private String pickupAddress;
    private Double pickupLat;
    private Double pickupLng;
    private String dropoffAddress;
    private Double dropoffLat;
    private Double dropoffLng;
    private LocalTime outwardTimeSlot; // e.g. 09:00
    private LocalTime returnTimeSlot; // e.g. 18:30 (if ROUND_TRIP)
    private Double distanceKm;
    private Double perRideFare;
    private Double discountPercentage;
    private Double totalPackageCost;
    private String routePolyline;

    public CreateSubscriptionRequestDto() {}

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public SubscriptionType getSubscriptionType() {
        return subscriptionType;
    }

    public void setSubscriptionType(SubscriptionType subscriptionType) {
        this.subscriptionType = subscriptionType;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public String getPickupAddress() {
        return pickupAddress;
    }

    public void setPickupAddress(String pickupAddress) {
        this.pickupAddress = pickupAddress;
    }

    public Double getPickupLat() {
        return pickupLat;
    }

    public void setPickupLat(Double pickupLat) {
        this.pickupLat = pickupLat;
    }

    public Double getPickupLng() {
        return pickupLng;
    }

    public void setPickupLng(Double pickupLng) {
        this.pickupLng = pickupLng;
    }

    public String getDropoffAddress() {
        return dropoffAddress;
    }

    public void setDropoffAddress(String dropoffAddress) {
        this.dropoffAddress = dropoffAddress;
    }

    public Double getDropoffLat() {
        return dropoffLat;
    }

    public void setDropoffLat(Double dropoffLat) {
        this.dropoffLat = dropoffLat;
    }

    public Double getDropoffLng() {
        return dropoffLng;
    }

    public void setDropoffLng(Double dropoffLng) {
        this.dropoffLng = dropoffLng;
    }

    public LocalTime getOutwardTimeSlot() {
        return outwardTimeSlot;
    }

    public void setOutwardTimeSlot(LocalTime outwardTimeSlot) {
        this.outwardTimeSlot = outwardTimeSlot;
    }

    public LocalTime getReturnTimeSlot() {
        return returnTimeSlot;
    }

    public void setReturnTimeSlot(LocalTime returnTimeSlot) {
        this.returnTimeSlot = returnTimeSlot;
    }

    public Double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(Double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public Double getPerRideFare() {
        return perRideFare;
    }

    public void setPerRideFare(Double perRideFare) {
        this.perRideFare = perRideFare;
    }

    public Double getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(Double discountPercentage) {
        this.discountPercentage = discountPercentage;
    }

    public Double getTotalPackageCost() {
        return totalPackageCost;
    }

    public void setTotalPackageCost(Double totalPackageCost) {
        this.totalPackageCost = totalPackageCost;
    }

    public String getRoutePolyline() {
        return routePolyline;
    }

    public void setRoutePolyline(String routePolyline) {
        this.routePolyline = routePolyline;
    }
}
