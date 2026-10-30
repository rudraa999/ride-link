package com.ridelink.controller;

import com.ridelink.dto.*;
import com.ridelink.model.College;
import com.ridelink.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getPlatformStats());
    }

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(adminService.getUsers(search, role));
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserDto> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        String role = payload.get("role");
        return ResponseEntity.ok(adminService.updateUserRole(id, role));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/availabilities")
    public ResponseEntity<List<AdminAvailabilityDto>> getAvailabilities(
            @RequestParam(required = false, defaultValue = "ALL") String status) {
        return ResponseEntity.ok(adminService.getAvailabilities(status));
    }

    @DeleteMapping("/availabilities/{id}")
    public ResponseEntity<Void> cancelAvailability(@PathVariable Long id) {
        adminService.cancelAvailability(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/matches")
    public ResponseEntity<List<AdminMatchDto>> getMatches() {
        return ResponseEntity.ok(adminService.getMatches());
    }

    @PutMapping("/matches/{id}/status")
    public ResponseEntity<AdminMatchDto> updateMatchStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(adminService.updateMatchStatus(id, status));
    }

    @GetMapping("/colleges")
    public ResponseEntity<List<College>> getColleges() {
        return ResponseEntity.ok(adminService.getColleges());
    }

    @PostMapping("/colleges")
    public ResponseEntity<College> addCollege(@RequestBody Map<String, String> payload) {
        String name = payload.get("name");
        String city = payload.get("city");
        return ResponseEntity.ok(adminService.addCollege(name, city));
    }

    @DeleteMapping("/colleges/{id}")
    public ResponseEntity<Void> deleteCollege(@PathVariable Long id) {
        adminService.deleteCollege(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLogDto>> getAuditLogs() {
        return ResponseEntity.ok(adminService.getAuditLogs());
    }
}
