package com.ridehail.controller;

import com.ridehail.dto.AuthRequest;
import com.ridehail.dto.AuthResponse;
import com.ridehail.dto.RegisterRequest;
import com.ridehail.dto.UserDto;
import com.ridehail.model.User;
import com.ridehail.repository.UserRepository;
import com.ridehail.security.CustomUserDetails;
import com.ridehail.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        return ResponseEntity.ok(new UserDto(user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getRole()));
    }
}
