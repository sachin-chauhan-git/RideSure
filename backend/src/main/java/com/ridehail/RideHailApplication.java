package com.ridehail;

import com.ridehail.model.*;
import com.ridehail.repository.DriverProfileRepository;
import com.ridehail.repository.UserRepository;
import com.ridehail.service.DriverLocationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class RideHailApplication {

    private static final Logger logger = LoggerFactory.getLogger(RideHailApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(RideHailApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(
            UserRepository userRepository,
            DriverProfileRepository driverProfileRepository,
            PasswordEncoder passwordEncoder,
            DriverLocationService driverLocationService
    ) {
        return args -> {
            logger.info("Initializing Greater Noida Seed Data for RideSure...");

            // 1. Admin User
            if (!userRepository.existsByEmail("admin@test.com")) {
                User admin = new User("System Admin", "admin@test.com", "+919999900000", passwordEncoder.encode("password123"), Role.ROLE_ADMIN);
                userRepository.save(admin);
            }

            // 2. Rider User (Rahul Sharma)
            if (!userRepository.existsByEmail("rider@test.com")) {
                User rider = new User("Rahul Sharma", "rider@test.com", "+919876543210", passwordEncoder.encode("password123"), Role.ROLE_RIDER);
                userRepository.save(rider);
            }

            // 3. Driver - Bike Taxi (Suresh Kumar, Pari Chowk)
            if (!userRepository.existsByEmail("bike.driver@test.com")) {
                User bikeDriver = new User("Suresh Kumar (Bike)", "bike.driver@test.com", "+919876500001", passwordEncoder.encode("password123"), Role.ROLE_DRIVER);
                User savedBike = userRepository.save(bikeDriver);

                DriverProfile bikeProfile = new DriverProfile(savedBike, VehicleType.BIKE, "UP-16-BK-9988", "Honda Activa 6G");
                bikeProfile.setOnline(true);
                bikeProfile.setRatingAvg(4.9);
                bikeProfile.setTotalTrips(142);
                bikeProfile.setCurrentLat(28.4633); // Pari Chowk, Greater Noida
                bikeProfile.setCurrentLng(77.5082);
                driverProfileRepository.save(bikeProfile);

                driverLocationService.updateDriverLocation(savedBike.getId(), 28.4633, 77.5082, VehicleType.BIKE, 45.0);
            }

            // 4. Driver - Cab Economy (Amit Patel, Knowledge Park II)
            if (!userRepository.existsByEmail("cab.driver@test.com")) {
                User cabDriver = new User("Amit Patel (Cab)", "cab.driver@test.com", "+919876500003", passwordEncoder.encode("password123"), Role.ROLE_DRIVER);
                User savedCab = userRepository.save(cabDriver);

                DriverProfile cabProfile = new DriverProfile(savedCab, VehicleType.CAB_ECONOMY, "UP-16-CB-7812", "Maruti Suzuki Dzire");
                cabProfile.setOnline(true);
                cabProfile.setRatingAvg(4.95);
                cabProfile.setTotalTrips(512);
                cabProfile.setCurrentLat(28.4570); // India Expo Mart / KP II
                cabProfile.setCurrentLng(77.5000);
                driverProfileRepository.save(cabProfile);

                driverLocationService.updateDriverLocation(savedCab.getId(), 28.4570, 77.5000, VehicleType.CAB_ECONOMY, 270.0);
            }

            logger.info("Greater Noida test accounts initialized successfully!");
        };
    }
}
