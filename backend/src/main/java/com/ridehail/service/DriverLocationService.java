package com.ridehail.service;

import com.ridehail.dto.DriverLocationDto;
import com.ridehail.dto.NearbyDriverDto;
import com.ridehail.model.DriverProfile;
import com.ridehail.model.VehicleType;
import com.ridehail.repository.DriverProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DriverLocationService {

    private static final Logger logger = LoggerFactory.getLogger(DriverLocationService.class);
    private static final String GEO_KEY_PREFIX = "drivers:geo:";
    private static final String DRIVER_META_KEY = "drivers:meta";

    private final RedisTemplate<String, Object> redisTemplate;
    private final DriverProfileRepository driverProfileRepository;

    // In-memory fallback map if Redis is not available
    private final Map<Long, DriverLocationDto> inMemoryDriverLocations = new ConcurrentHashMap<>();
    private boolean redisAvailable = true;

    public DriverLocationService(RedisTemplate<String, Object> redisTemplate, DriverProfileRepository driverProfileRepository) {
        this.redisTemplate = redisTemplate;
        this.driverProfileRepository = driverProfileRepository;
    }

    /**
     * Update driver's live GPS position in Redis GEO set and database
     */
    public void updateDriverLocation(Long driverId, Double lat, Double lng, VehicleType vehicleType, Double heading) {
        DriverLocationDto locationDto = new DriverLocationDto(driverId, lat, lng, vehicleType, heading != null ? heading : 0.0);
        inMemoryDriverLocations.put(driverId, locationDto);

        if (redisAvailable) {
            try {
                String geoKey = GEO_KEY_PREFIX + vehicleType.name();
                redisTemplate.opsForGeo().add(
                        geoKey,
                        new Point(lng, lat),
                        driverId.toString()
                );
                // Also add to global geo key
                redisTemplate.opsForGeo().add(
                        GEO_KEY_PREFIX + "ALL",
                        new Point(lng, lat),
                        driverId.toString()
                );
            } catch (Exception e) {
                logger.warn("Redis unavailable for Geo update, using in-memory store: {}", e.getMessage());
                redisAvailable = false;
            }
        }

        // Update database coordinates asynchronously / when possible
        try {
            driverProfileRepository.findByUserId(driverId).ifPresent(profile -> {
                profile.setCurrentLat(lat);
                profile.setCurrentLng(lng);
                driverProfileRepository.save(profile);
            });
        } catch (Exception e) {
            logger.error("Failed to update driver profile in database: {}", e.getMessage());
        }
    }

    /**
     * Remove driver from available pool (when offline or busy)
     */
    public void removeDriverFromAvailable(Long driverId, VehicleType vehicleType) {
        inMemoryDriverLocations.remove(driverId);
        if (redisAvailable) {
            try {
                if (vehicleType != null) {
                    redisTemplate.opsForZSet().remove(GEO_KEY_PREFIX + vehicleType.name(), driverId.toString());
                }
                redisTemplate.opsForZSet().remove(GEO_KEY_PREFIX + "ALL", driverId.toString());
            } catch (Exception e) {
                logger.warn("Error removing driver from Redis: {}", e.getMessage());
            }
        }
    }

    /**
     * Find nearby drivers within radius (km) sorted by distance
     */
    public List<NearbyDriverDto> findNearbyDrivers(Double lat, Double lng, Double radiusKm, VehicleType vehicleType) {
        List<NearbyDriverDto> nearbyDrivers = new ArrayList<>();

        if (redisAvailable) {
            try {
                String geoKey = (vehicleType != null) ? GEO_KEY_PREFIX + vehicleType.name() : GEO_KEY_PREFIX + "ALL";
                Circle circle = new Circle(new Point(lng, lat), new Distance(radiusKm, Metrics.KILOMETERS));
                RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs.newGeoRadiusArgs()
                        .includeDistance()
                        .includeCoordinates()
                        .sortAscending()
                        .limit(10);

                GeoResults<RedisGeoCommands.GeoLocation<Object>> results = redisTemplate.opsForGeo().radius(geoKey, circle, args);

                if (results != null) {
                    for (GeoResult<RedisGeoCommands.GeoLocation<Object>> result : results) {
                        String driverIdStr = result.getContent().getName().toString();
                        Long driverId = Long.parseLong(driverIdStr);
                        Point point = result.getContent().getPoint();
                        double distance = result.getDistance().getValue();

                        // Verify online and not busy from DB or cache
                        Optional<DriverProfile> profileOpt = driverProfileRepository.findByUserId(driverId);
                        if (profileOpt.isPresent() && profileOpt.get().isOnline() && !profileOpt.get().isBusy()) {
                            DriverProfile profile = profileOpt.get();
                            int etaMinutes = (int) Math.max(1, Math.round((distance / 25.0) * 60)); // Avg city speed ~25 km/h
                            nearbyDrivers.add(new NearbyDriverDto(
                                    driverId,
                                    point.getY(),
                                    point.getX(),
                                    profile.getVehicleType(),
                                    Math.round(distance * 100.0) / 100.0,
                                    etaMinutes
                            ));
                        }
                    }
                    return nearbyDrivers;
                }
            } catch (Exception e) {
                logger.warn("Redis geo radius query failed, falling back to in-memory: {}", e.getMessage());
                redisAvailable = false;
            }
        }

        // In-memory Fallback (Haversine Distance calculation)
        List<DriverProfile> onlineDrivers = (vehicleType != null)
                ? driverProfileRepository.findByIsOnlineTrueAndIsBusyFalseAndVehicleType(vehicleType)
                : driverProfileRepository.findByIsOnlineTrueAndIsBusyFalse();

        for (DriverProfile profile : onlineDrivers) {
            Double dLat = profile.getCurrentLat();
            Double dLng = profile.getCurrentLng();
            if (dLat != null && dLng != null) {
                double distance = calculateHaversineDistanceKm(lat, lng, dLat, dLng);
                if (distance <= radiusKm) {
                    int etaMinutes = (int) Math.max(1, Math.round((distance / 25.0) * 60));
                    nearbyDrivers.add(new NearbyDriverDto(
                            profile.getUser().getId(),
                            dLat,
                            dLng,
                            profile.getVehicleType(),
                            Math.round(distance * 100.0) / 100.0,
                            etaMinutes
                    ));
                }
            }
        }

        nearbyDrivers.sort(Comparator.comparingDouble(NearbyDriverDto::getDistanceKm));
        return nearbyDrivers.size() > 10 ? nearbyDrivers.subList(0, 10) : nearbyDrivers;
    }

    public static double calculateHaversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
