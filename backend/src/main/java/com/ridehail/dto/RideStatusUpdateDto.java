package com.ridehail.dto;

import com.ridehail.model.RideStatus;

public class RideStatusUpdateDto {
    private RideStatus status;
    private String otp; // Required when transitioning to IN_TRANSIT
    private String cancellationReason;

    public RideStatusUpdateDto() {}

    public RideStatus getStatus() {
        return status;
    }

    public void setStatus(RideStatus status) {
        this.status = status;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }
}
