package com.ridehail.dto;

import com.ridehail.model.Role;
import com.ridehail.model.VehicleType;

public class AuthResponse {
    private String token;
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private Role role;
    private DriverProfileDto driverProfile;

    public AuthResponse() {}

    public AuthResponse(String token, Long userId, String name, String email, String phone, Role role, DriverProfileDto driverProfile) {
        this.token = token;
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.driverProfile = driverProfile;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public DriverProfileDto getDriverProfile() {
        return driverProfile;
    }

    public void setDriverProfile(DriverProfileDto driverProfile) {
        this.driverProfile = driverProfile;
    }
}
