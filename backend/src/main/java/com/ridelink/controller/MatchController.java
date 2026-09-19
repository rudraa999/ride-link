package com.ridelink.controller;

import com.ridelink.dto.RideMatchDto;
import com.ridelink.security.UserPrincipal;
import com.ridelink.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchService matchService;

    @GetMapping("/history")
    public ResponseEntity<List<RideMatchDto>> getMatchHistory(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam(value = "status", required = false) String status) {
        return ResponseEntity.ok(matchService.getMatchHistory(currentUser.getId(), status));
    }

    @GetMapping("/active")
    public ResponseEntity<RideMatchDto> getActiveMatch(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return matchService.getActiveMatch(currentUser.getId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/{matchId}")
    public ResponseEntity<RideMatchDto> getMatchById(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long matchId) {
        return ResponseEntity.ok(matchService.getMatchById(currentUser.getId(), matchId));
    }

    @PutMapping("/{matchId}/status")
    public ResponseEntity<RideMatchDto> updateMatchStatus(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long matchId,
            @RequestParam("status") String status) {
        return ResponseEntity.ok(matchService.updateMatchStatus(currentUser.getId(), matchId, status));
    }
}
