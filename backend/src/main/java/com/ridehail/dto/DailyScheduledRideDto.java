package com.ridehail.dto;

import com.ridehail.model.DailyTripStatus;
import com.ridehail.model.TripLeg;
import java.time.LocalDate;
import java.time.LocalTime;

public class DailyScheduledRideDto {
    private Long id;
    private Long subscriptionId;
    private LocalDate tripDate;
    private TripLeg leg;
    private LocalTime scheduledTime;
    private Long assignedDriverId;
    private String assignedDriverName;
    private boolean isBackupDriver;
    private Long linkedRideId;
    private String otp; // Present if today's ride is dispatched
    private DailyTripStatus status;
    private Double dailyFare;

    public DailyScheduledRideDto() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSubscriptionId() {
        return subscriptionId;
    }

    public void setSubscriptionId(Long subscriptionId) {
        this.subscriptionId = subscriptionId;
    }

    public LocalDate getTripDate() {
        return tripDate;
    }

    public void setTripDate(LocalDate tripDate) {
        this.tripDate = tripDate;
    }

    public TripLeg getLeg() {
        return leg;
    }

    public void setLeg(TripLeg leg) {
        this.leg = leg;
    }

    public LocalTime getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(LocalTime scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public Long getAssignedDriverId() {
        return assignedDriverId;
    }

    public void setAssignedDriverId(Long assignedDriverId) {
        this.assignedDriverId = assignedDriverId;
    }

    public String getAssignedDriverName() {
        return assignedDriverName;
    }

    public void setAssignedDriverName(String assignedDriverName) {
        this.assignedDriverName = assignedDriverName;
    }

    public boolean isBackupDriver() {
        return isBackupDriver;
    }

    public void setBackupDriver(boolean backupDriver) {
        isBackupDriver = backupDriver;
    }

    public Long getLinkedRideId() {
        return linkedRideId;
    }

    public void setLinkedRideId(Long linkedRideId) {
        this.linkedRideId = linkedRideId;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public DailyTripStatus getStatus() {
        return status;
    }

    public void setStatus(DailyTripStatus status) {
        this.status = status;
    }

    public Double getDailyFare() {
        return dailyFare;
    }

    public void setDailyFare(Double dailyFare) {
        this.dailyFare = dailyFare;
    }
}
