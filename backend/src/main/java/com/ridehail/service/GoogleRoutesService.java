package com.ridehail.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
public class GoogleRoutesService {

    private static final Logger logger = LoggerFactory.getLogger(GoogleRoutesService.class);
    private static final String ROUTES_API_URL = "https://routes.googleapis.com/directions/v2:computeRoutes";

    @Value("${app.maps.api-key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public static class RouteResult {
        private final double distanceKm;
        private final int durationMinutes;
        private final String encodedPolyline;

        public RouteResult(double distanceKm, int durationMinutes, String encodedPolyline) {
            this.distanceKm = distanceKm;
            this.durationMinutes = durationMinutes;
            this.encodedPolyline = encodedPolyline;
        }

        public double getDistanceKm() {
            return distanceKm;
        }

        public int getDurationMinutes() {
            return durationMinutes;
        }

        public String getEncodedPolyline() {
            return encodedPolyline;
        }
    }

    /**
     * Compute route using Google Maps Routes API (or mathematical approximation if API key is not configured)
     */
    public RouteResult computeRoute(double originLat, double originLng, double destLat, double destLng) {
        if (apiKey != null && !apiKey.trim().isEmpty()) {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("X-Goog-Api-Key", apiKey);
                headers.set("X-Goog-FieldMask", "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline");

                Map<String, Object> originObj = Map.of(
                        "location", Map.of("latLng", Map.of("latitude", originLat, "longitude", originLng))
                );
                Map<String, Object> destObj = Map.of(
                        "location", Map.of("latLng", Map.of("latitude", destLat, "longitude", destLng))
                );

                Map<String, Object> requestBody = Map.of(
                        "origin", originObj,
                        "destination", destObj,
                        "travelMode", "DRIVE",
                        "routingPreference", "TRAFFIC_AWARE"
                );

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
                ResponseEntity<Map> response = restTemplate.exchange(ROUTES_API_URL, HttpMethod.POST, entity, Map.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    List<Map<String, Object>> routes = (List<Map<String, Object>>) response.getBody().get("routes");
                    if (routes != null && !routes.isEmpty()) {
                        Map<String, Object> route = routes.get(0);
                        int distanceMeters = ((Number) route.getOrDefault("distanceMeters", 0)).intValue();
                        String durationStr = (String) route.getOrDefault("duration", "0s");
                        int durationSeconds = parseDurationSeconds(durationStr);

                        Map<String, Object> polylineObj = (Map<String, Object>) route.get("polyline");
                        String polyline = polylineObj != null ? (String) polylineObj.get("encodedPolyline") : "";

                        double distanceKm = Math.round((distanceMeters / 1000.0) * 100.0) / 100.0;
                        int durationMinutes = Math.max(1, (int) Math.ceil(durationSeconds / 60.0));

                        return new RouteResult(distanceKm, durationMinutes, polyline);
                    }
                }
            } catch (Exception e) {
                logger.warn("Google Routes API call failed ({}), calculating route fallback: {}", e.getClass().getSimpleName(), e.getMessage());
            }
        }

        // Fallback: Haversine distance with street route factor (1.3x) and encoded polyline
        double straightDistanceKm = DriverLocationService.calculateHaversineDistanceKm(originLat, originLng, destLat, destLng);
        double roadDistanceKm = Math.max(0.5, Math.round(straightDistanceKm * 1.35 * 100.0) / 100.0);
        int durationMinutes = Math.max(2, (int) Math.round((roadDistanceKm / 28.0) * 60)); // Avg 28 km/h city speed
        String syntheticPolyline = generatePolyline(originLat, originLng, destLat, destLng);

        return new RouteResult(roadDistanceKm, durationMinutes, syntheticPolyline);
    }

    private int parseDurationSeconds(String durationStr) {
        if (durationStr == null) return 0;
        String clean = durationStr.replace("s", "").trim();
        try {
            return Integer.parseInt(clean);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /**
     * Encodes a simple polyline path with midpoint curve between two coordinates
     */
    private String generatePolyline(double lat1, double lng1, double lat2, double lng2) {
        // Encode simple 3-point polyline (origin, curved midpoint, dest)
        double midLat = (lat1 + lat2) / 2 + (lng2 - lng1) * 0.05;
        double midLng = (lng1 + lng2) / 2 - (lat2 - lat1) * 0.05;

        List<double[]> points = List.of(
                new double[]{lat1, lng1},
                new double[]{midLat, midLng},
                new double[]{lat2, lng2}
        );
        return encodePolylinePoints(points);
    }

    private String encodePolylinePoints(List<double[]> coords) {
        StringBuilder result = new StringBuilder();
        int prevLat = 0;
        int prevLng = 0;

        for (double[] point : coords) {
            int lat = (int) Math.round(point[0] * 1e5);
            int lng = (int) Math.round(point[1] * 1e5);

            encodeSignedNumber(lat - prevLat, result);
            encodeSignedNumber(lng - prevLng, result);

            prevLat = lat;
            prevLng = lng;
        }
        return result.toString();
    }

    private void encodeSignedNumber(int num, StringBuilder result) {
        int sgn_num = num < 0 ? ~(num << 1) : (num << 1);
        while (sgn_num >= 0x20) {
            result.append((char) ((0x20 | (sgn_num & 0x1f)) + 63));
            sgn_num >>= 5;
        }
        result.append((char) (sgn_num + 63));
    }
}
