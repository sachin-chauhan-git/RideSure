package com.ridehail;

import com.ridehail.model.VehicleType;
import com.ridehail.service.DriverLocationService;
import com.ridehail.service.FareCalculationService;
import com.ridehail.service.GoogleRoutesService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class RideHailApplicationTests {

	@Autowired
	private FareCalculationService fareCalculationService;

	@Autowired
	private DriverLocationService driverLocationService;

	@Test
	void contextLoads() {
		assertNotNull(fareCalculationService);
		assertNotNull(driverLocationService);
	}

	@Test
	void testFareCalculation() {
		// 10 km, 20 minutes
		double bikeFare = fareCalculationService.calculateFare(VehicleType.BIKE, 10.0, 20, 1.0);
		// Base: 20 + (10 * 8) + (20 * 1.5) = 20 + 80 + 30 = 130
		assertEquals(130.0, bikeFare, 0.1);

		double autoFare = fareCalculationService.calculateFare(VehicleType.AUTO, 10.0, 20, 1.0);
		// Base: 30 + (10 * 12) + (20 * 2.0) = 30 + 120 + 40 = 190
		assertEquals(190.0, autoFare, 0.1);

		double surgeFare = fareCalculationService.calculateFare(VehicleType.BIKE, 10.0, 20, 1.5);
		assertEquals(195.0, surgeFare, 0.1);
	}

	@Test
	void testHaversineDistance() {
		// Bangalore (Indiranagar: 12.9716, 77.5946 to Koramangala: 12.9352, 77.6245)
		double distance = DriverLocationService.calculateHaversineDistanceKm(12.9716, 77.5946, 12.9352, 77.6245);
		assertTrue(distance > 3.0 && distance < 6.0, "Distance between Indiranagar and Koramangala should be ~5km");
	}
}
