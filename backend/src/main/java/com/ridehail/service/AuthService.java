package com.ridehail.service;

import com.ridehail.dto.*;
import com.ridehail.model.*;
import com.ridehail.repository.DriverProfileRepository;
import com.ridehail.repository.UserRepository;
import com.ridehail.security.CustomUserDetails;
import com.ridehail.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final DriverProfileRepository driverProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(
            UserRepository userRepository,
            DriverProfileRepository driverProfileRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager
    ) {
        this.userRepository = userRepository;
        this.driverProfileRepository = driverProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone number is already registered");
        }

        Role role = request.getRole() != null ? request.getRole() : Role.ROLE_RIDER;

        User user = new User(
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                passwordEncoder.encode(request.getPassword()),
                role
        );
        User savedUser = userRepository.save(user);

        DriverProfileDto driverProfileDto = null;
        if (role == Role.ROLE_DRIVER) {
            VehicleType vehicleType = request.getVehicleType() != null ? request.getVehicleType() : VehicleType.BIKE;
            String vehicleNumber = request.getVehicleNumber() != null ? request.getVehicleNumber() : "DL-01-AB-1234";
            String vehicleModel = request.getVehicleModel() != null ? request.getVehicleModel() : "Standard";

            DriverProfile profile = new DriverProfile(savedUser, vehicleType, vehicleNumber, vehicleModel);
            DriverProfile savedProfile = driverProfileRepository.save(profile);
            driverProfileDto = mapToDriverDto(savedProfile);
        }

        CustomUserDetails userDetails = new CustomUserDetails(savedUser);
        String token = jwtService.generateToken(userDetails, savedUser.getId(), savedUser.getRole().name());

        return new AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole(),
                driverProfileDto
        );
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String token = jwtService.generateToken(userDetails, user.getId(), user.getRole().name());

        DriverProfileDto driverProfileDto = null;
        if (user.getRole() == Role.ROLE_DRIVER) {
            driverProfileDto = driverProfileRepository.findByUserId(user.getId())
                    .map(this::mapToDriverDto)
                    .orElse(null);
        }

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                driverProfileDto
        );
    }

    public DriverProfileDto mapToDriverDto(DriverProfile profile) {
        DriverProfileDto dto = new DriverProfileDto();
        dto.setId(profile.getId());
        dto.setUserId(profile.getUser().getId());
        dto.setDriverName(profile.getUser().getName());
        dto.setDriverPhone(profile.getUser().getPhone());
        dto.setVehicleType(profile.getVehicleType());
        dto.setVehicleNumber(profile.getVehicleNumber());
        dto.setVehicleModel(profile.getVehicleModel());
        dto.setOnline(profile.isOnline());
        dto.setBusy(profile.isBusy());
        dto.setCurrentLat(profile.getCurrentLat());
        dto.setCurrentLng(profile.getCurrentLng());
        dto.setRatingAvg(profile.getRatingAvg());
        dto.setTotalTrips(profile.getTotalTrips());
        return dto;
    }
}
