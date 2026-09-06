package com.ridehail.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "daily_scheduled_rides")
public class DailyScheduledRide {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false)
    @JsonIgnore
    private RideSubscription subscription;

    @Column(nullable = false)
    private LocalDate tripDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TripLeg leg = TripLeg.OUTWARD; // OUTWARD or RETURN

    @Column(nullable = false)
    private LocalTime scheduledTime;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_driver_id")
    private User assignedDriver;

    private boolean isBackupDriver = false;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "linked_ride_id")
    private Ride linkedRide; // Created when dispatched

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DailyTripStatus status = DailyTripStatus.SCHEDULED;

    @Column(nullable = false)
    private Double dailyFare;

    public DailyScheduledRide() {}

    public DailyScheduledRide(
            RideSubscription subscription,
            LocalDate tripDate,
            TripLeg leg,
            LocalTime scheduledTime,
            User assignedDriver,
            Double dailyFare
    ) {
        this.subscription = subscription;
        this.tripDate = tripDate;
        this.leg = leg;
        this.scheduledTime = scheduledTime;
        this.assignedDriver = assignedDriver;
        this.dailyFare = dailyFare;
        this.status = DailyTripStatus.SCHEDULED;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RideSubscription getSubscription() {
        return subscription;
    }

    public void setSubscription(RideSubscription subscription) {
        this.subscription = subscription;
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

    public User getAssignedDriver() {
        return assignedDriver;
    }

    public void setAssignedDriver(User assignedDriver) {
        this.assignedDriver = assignedDriver;
    }

    public boolean isBackupDriver() {
        return isBackupDriver;
    }

    public void setBackupDriver(boolean backupDriver) {
        isBackupDriver = backupDriver;
    }

    public Ride getLinkedRide() {
        return linkedRide;
    }

    public void setLinkedRide(Ride linkedRide) {
        this.linkedRide = linkedRide;
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
