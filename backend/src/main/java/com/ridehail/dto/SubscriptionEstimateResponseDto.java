package com.ridehail.dto;

import com.ridehail.model.SubscriptionType;
import com.ridehail.model.VehicleType;

public class SubscriptionEstimateResponseDto {
    private VehicleType vehicleType;
    private SubscriptionType subscriptionType;
    private int totalDays;
    private int totalTrips; // totalDays * (ONE_WAY ? 1 : 2)
    private double distanceKm;
    private double baseSingleFare;
    private double standardTotalCost; // totalTrips * baseSingleFare
    private double discountPercentage; // e.g. 20.0
    private double discountedPackageCost; // Total cost to be locked in escrow
    private double dailyEffectiveRate;
    private double totalSavings;
    private String routePolyline;

    public SubscriptionEstimateResponseDto() {}

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

    public int getTotalDays() {
        return totalDays;
    }

    public void setTotalDays(int totalDays) {
        this.totalDays = totalDays;
    }

    public int getTotalTrips() {
        return totalTrips;
    }

    public void setTotalTrips(int totalTrips) {
        this.totalTrips = totalTrips;
    }

    public double getDistanceKm() {
        return distanceKm;
    }

    public void setDistanceKm(double distanceKm) {
        this.distanceKm = distanceKm;
    }

    public double getBaseSingleFare() {
        return baseSingleFare;
    }

    public void setBaseSingleFare(double baseSingleFare) {
        this.baseSingleFare = baseSingleFare;
    }

    public double getStandardTotalCost() {
        return standardTotalCost;
    }

    public void setStandardTotalCost(double standardTotalCost) {
        this.standardTotalCost = standardTotalCost;
    }

    public double getDiscountPercentage() {
        return discountPercentage;
    }

    public void setDiscountPercentage(double discountPercentage) {
        this.discountPercentage = discountPercentage;
    }

    public double getDiscountedPackageCost() {
        return discountedPackageCost;
    }

    public void setDiscountedPackageCost(double discountedPackageCost) {
        this.discountedPackageCost = discountedPackageCost;
    }

    public double getDailyEffectiveRate() {
        return dailyEffectiveRate;
    }

    public void setDailyEffectiveRate(double dailyEffectiveRate) {
        this.dailyEffectiveRate = dailyEffectiveRate;
    }

    public double getTotalSavings() {
        return totalSavings;
    }

    public void setTotalSavings(double totalSavings) {
        this.totalSavings = totalSavings;
    }

    public String getRoutePolyline() {
        return routePolyline;
    }

    public void setRoutePolyline(String routePolyline) {
        this.routePolyline = routePolyline;
    }
}
