package com.ridelink.controller;

import com.ridelink.dto.RideMatchDto;
import com.ridelink.dto.RideRequestDto;
import com.ridelink.dto.SendRideRequestDto;
import com.ridelink.security.UserPrincipal;
import com.ridelink.service.RequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class RequestController {

    private final RequestService requestService;

    @PostMapping("/send")
    public ResponseEntity<RideRequestDto> sendRideRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody SendRideRequestDto dto) {
        return ResponseEntity.ok(requestService.sendRideRequest(currentUser.getId(), dto));
    }

    @PostMapping("/{requestId}/accept")
    public ResponseEntity<RideMatchDto> acceptRideRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long requestId) {
        return ResponseEntity.ok(requestService.acceptRideRequest(currentUser.getId(), requestId));
    }

    @PostMapping("/{requestId}/reject")
    public ResponseEntity<Void> rejectRideRequest(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long requestId) {
        requestService.rejectRideRequest(currentUser.getId(), requestId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/incoming")
    public ResponseEntity<List<RideRequestDto>> getIncomingRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(requestService.getIncomingPendingRequests(currentUser.getId()));
    }
}
