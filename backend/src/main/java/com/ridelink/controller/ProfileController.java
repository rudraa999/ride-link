package com.ridelink.controller;

import com.ridelink.dto.ChangePasswordRequest;
import com.ridelink.dto.PrivacySettingsRequest;
import com.ridelink.dto.ProfileUpdateRequest;
import com.ridelink.dto.UserDto;
import com.ridelink.model.User;
import com.ridelink.repository.UserRepository;
import com.ridelink.security.UserPrincipal;
import com.ridelink.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<UserDto> getProfile(@AuthenticationPrincipal UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(UserDto.fromEntity(user));
    }

    @PutMapping
    public ResponseEntity<UserDto> updateProfile(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody ProfileUpdateRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getActiveCampus() != null && !request.getActiveCampus().trim().isEmpty()) {
            user.setActiveCampus(request.getActiveCampus().trim());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone().trim());
        }
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl().trim());
        }
        if (request.getShowProfile() != null) {
            user.setShowProfile(request.getShowProfile());
        }
        if (request.getShowPhonePostMatch() != null) {
            user.setShowPhonePostMatch(request.getShowPhonePostMatch());
        }
        if (request.getShowPreciseDistance() != null) {
            user.setShowPreciseDistance(request.getShowPreciseDistance());
        }
        if (request.getShowRideStats() != null) {
            user.setShowRideStats(request.getShowRideStats());
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(UserDto.fromEntity(saved));
    }

    @PutMapping("/privacy")
    public ResponseEntity<UserDto> updatePrivacy(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody PrivacySettingsRequest request) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getShowProfile() != null) {
            user.setShowProfile(request.getShowProfile());
        }
        if (request.getShowPhonePostMatch() != null) {
            user.setShowPhonePostMatch(request.getShowPhonePostMatch());
        }
        if (request.getShowPreciseDistance() != null) {
            user.setShowPreciseDistance(request.getShowPreciseDistance());
        }
        if (request.getShowRideStats() != null) {
            user.setShowRideStats(request.getShowRideStats());
        }

        User saved = userRepository.save(user);
        return ResponseEntity.ok(UserDto.fromEntity(saved));
    }

    @PutMapping("/campus")
    public ResponseEntity<UserDto> updateCampus(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String campus = payload.get("activeCampus");
        if (campus != null && !campus.trim().isEmpty()) {
            user.setActiveCampus(campus.trim());
            User saved = userRepository.save(user);
            return ResponseEntity.ok(UserDto.fromEntity(saved));
        }
        return ResponseEntity.badRequest().build();
    }

    @PostMapping("/photo")
    public ResponseEntity<UserDto> uploadProfilePhoto(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam("file") MultipartFile file) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String imageUrl = cloudinaryService.uploadImage(file);
        if (imageUrl != null) {
            user.setProfileImageUrl(imageUrl);
            User saved = userRepository.save(user);
            return ResponseEntity.ok(UserDto.fromEntity(saved));
        }
        return ResponseEntity.badRequest().build();
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestBody ChangePasswordRequest request) {
        if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()
                || request.getNewPassword() == null || request.getNewPassword().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password and new password are required."));
        }

        if (request.getNewPassword().length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("message", "New password must be at least 6 characters long."));
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Incorrect current password."));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully."));
    }
}
