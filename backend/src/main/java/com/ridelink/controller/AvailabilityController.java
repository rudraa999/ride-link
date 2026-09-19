package com.ridelink.controller;

import com.ridelink.dto.AvailabilityRequest;
import com.ridelink.dto.AvailabilityResponse;
import com.ridelink.dto.MatchedStudentDto;
import com.ridelink.security.UserPrincipal;
import com.ridelink.service.AvailabilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @PostMapping("/start")
    public ResponseEntity<AvailabilityResponse> startAvailability(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody AvailabilityRequest request) {
        return ResponseEntity.ok(availabilityService.startAvailability(currentUser.getId(), request));
    }

    @PostMapping("/stop")
    public ResponseEntity<Void> stopAvailability(@AuthenticationPrincipal UserPrincipal currentUser) {
        availabilityService.stopAvailability(currentUser.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/current")
    public ResponseEntity<AvailabilityResponse> getCurrentAvailability(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return availabilityService.getCurrentAvailability(currentUser.getId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/matches")
    public ResponseEntity<List<MatchedStudentDto>> getMatchingStudents(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(availabilityService.findMatchingStudents(currentUser.getId()));
    }
}
