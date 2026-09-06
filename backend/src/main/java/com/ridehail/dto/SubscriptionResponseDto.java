package com.ridehail.dto;

import com.ridehail.model.SubscriptionStatus;
import com.ridehail.model.SubscriptionType;
import com.ridehail.model.VehicleType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class SubscriptionResponseDto {
    private Long id;
    private Long riderId;
    private String riderName;
    private String riderPhone;
    private Long driverId;
    private String driverName;
    private String driverPhone;
    private String vehicleNumber;
    private String vehicleModel;
    private VehicleType vehicleType;
    private SubscriptionType subscriptionType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer totalDays;
    private Integer completedTrips;
    private Integer totalTrips;
    private String pickupAddress;
    private Double pickupLat;
    private Double pickupLng;
    private String dropoffAddress;
    private Double dropoffLat;
    private Double dropoffLng;
    private LocalTime outwardTimeSlot;
    private LocalTime returnTimeSlot;
    private Double distanceKm;
    private Double perRideFare;
    private Double discountPercentage;
    private Double totalPackageCost;
    private Double escrowAmountLocked;
    private SubscriptionStatus status;
    private String routePolyline;
    private List<DailyScheduledRideDto> dailyRides;
    private LocalDateTime createdAt;

    public SubscriptionResponseDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRiderId() {
        return riderId;
    }

    public void setRiderId(Long riderId) {
        this.riderId = riderId;
    }

    public String getRiderName() {
        return riderName;
    }

    public void setRiderName(String riderName) {
        this.riderName = riderName;
    }

    public String getRiderPhone() {
        return riderPhone;
    }

    public void setRiderPhone(String riderPhone) {
        this.riderPhone = riderPhone;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setDriverId(Long driverId) {
        this.driverId = driverId;
    }

    public String getDriverName() {
        return driverName;
    }

    public void setDriverName(String driverName) {
        this.driverName = driverName;
    }

    public String getDriverPhone() {
        return driverPhone;
    }

    public void setDriverPhone(String driverPhone) {
        this.driverPhone = driverPhone;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getVehicleModel() {
        return vehicleModel;
    }

    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }

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

    public Integer getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(Integer totalDays) {
        this.totalDays = totalDays;
    }

    public Integer getCompletedTrips() {
        return completedTrips;
    }

    public void setCompletedTrips(Integer completedTrips) {
        this.completedTrips = completedTrips;
    }

    public Integer getTotalTrips() {
        return totalTrips;
    }

    public void setTotalTrips(Integer totalTrips) {
        this.totalTrips = totalTrips;
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

    public Double getEscrowAmountLocked() {
        return escrowAmountLocked;
    }

    public void setEscrowAmountLocked(Double escrowAmountLocked) {
        this.escrowAmountLocked = escrowAmountLocked;
    }

    public SubscriptionStatus getStatus() {
        return status;
    }

    public void setStatus(SubscriptionStatus status) {
        this.status = status;
    }

    public String getRoutePolyline() {
        return routePolyline;
    }

    public void setRoutePolyline(String routePolyline) {
        this.routePolyline = routePolyline;
    }

    public List<DailyScheduledRideDto> getDailyRides() {
        return dailyRides;
    }

    public void setDailyRides(List<DailyScheduledRideDto> dailyRides) {
        this.dailyRides = dailyRides;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
