package com.ridehail.model;

public enum VehicleType {
    BIKE("Bike Taxi (Rapido style)", 20.0, 8.0, 1.5, 1),
    AUTO("Auto Rickshaw", 30.0, 12.0, 2.0, 3),
    CAB_ECONOMY("Economy Cab (Mini)", 50.0, 15.0, 2.5, 4),
    CAB_PREMIUM("Premium Cab (Sedan/SUV)", 80.0, 20.0, 3.5, 4);

    private final String displayName;
    private final double baseFare;
    private final double perKmRate;
    private final double perMinuteRate;
    private final int capacity;

    VehicleType(String displayName, double baseFare, double perKmRate, double perMinuteRate, int capacity) {
        this.displayName = displayName;
        this.baseFare = baseFare;
        this.perKmRate = perKmRate;
        this.perMinuteRate = perMinuteRate;
        this.capacity = capacity;
    }

    public String getDisplayName() {
        return displayName;
    }

    public double getBaseFare() {
        return baseFare;
    }

    public double getPerKmRate() {
        return perKmRate;
    }

    public double getPerMinuteRate() {
        return perMinuteRate;
    }

    public int getCapacity() {
        return capacity;
    }
}
