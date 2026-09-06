package com.ridehail.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ride_subscriptions")
public class RideSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rider_id", nullable = false)
    private User rider;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "driver_id")
    private User driver;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType vehicleType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionType subscriptionType; // ONE_WAY or ROUND_TRIP

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Integer totalDays;

    @Column(nullable = false)
    private String pickupAddress;

    @Column(nullable = false)
    private Double pickupLat;

    @Column(nullable = false)
    private Double pickupLng;

    @Column(nullable = false)
    private String dropoffAddress;

    @Column(nullable = false)
    private Double dropoffLat;

    @Column(nullable = false)
    private Double dropoffLng;

    @Column(nullable = false)
    private LocalTime outwardTimeSlot; // e.g. 09:00

    private LocalTime returnTimeSlot; // e.g. 18:30 (for ROUND_TRIP)

    @Column(nullable = false)
    private Double distanceKm;

    @Column(nullable = false)
    private Double perRideFare;

    @Column(nullable = false)
    private Double discountPercentage; // e.g. 15.0 for 15%

    @Column(nullable = false)
    private Double totalPackageCost;

    @Column(nullable = false)
    private Double escrowAmountLocked;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubscriptionStatus status = SubscriptionStatus.PENDING_DRIVER;

    @Column(columnDefinition = "TEXT")
    private String routePolyline;

    @OneToMany(mappedBy = "subscription", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DailyScheduledRide> dailyRides = new ArrayList<>();

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public RideSubscription() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getRider() {
        return rider;
    }

    public void setRider(User rider) {
        this.rider = rider;
    }

    public User getDriver() {
        return driver;
    }

    public void setDriver(User driver) {
        this.driver = driver;
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

    public List<DailyScheduledRide> getDailyRides() {
        return dailyRides;
    }

    public void setDailyRides(List<DailyScheduledRide> dailyRides) {
        this.dailyRides = dailyRides;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
