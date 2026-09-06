package com.ridehail.controller;

import com.ridehail.service.GoogleRoutesService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/maps")
public class MapsProxyController {

    private final GoogleRoutesService googleRoutesService;

    public MapsProxyController(GoogleRoutesService googleRoutesService) {
        this.googleRoutesService = googleRoutesService;
    }

    @GetMapping("/route")
    public ResponseEntity<GoogleRoutesService.RouteResult> getRoute(
            @RequestParam double originLat,
            @RequestParam double originLng,
            @RequestParam double destLat,
            @RequestParam double destLng
    ) {
        return ResponseEntity.ok(googleRoutesService.computeRoute(originLat, originLng, destLat, destLng));
    }
}
