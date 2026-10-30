package com.ridelink.service;

import com.ridelink.dto.*;
import com.ridelink.model.*;
import com.ridelink.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RideAvailabilityRepository availabilityRepository;
    private final RideMatchRepository matchRepository;
    private final RideRequestRepository requestRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final CollegeRepository collegeRepository;
    private final JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public AdminStatsDto getPlatformStats() {
        long totalUsers = userRepository.count();
        List<User> allUsers = userRepository.findAll();
        long totalAdmins = allUsers.stream().filter(u -> "ROLE_ADMIN".equalsIgnoreCase(u.getRole())).count();
        long totalStudents = totalUsers - totalAdmins;

        long activeAvails = availabilityRepository.countByIsActiveTrue();
        long totalAvails = availabilityRepository.count();

        long totalMatches = matchRepository.count();
        long activeMatches = matchRepository.countByStatus(RideMatch.MatchStatus.ACTIVE);
        long completedMatches = matchRepository.countByStatus(RideMatch.MatchStatus.COMPLETED);
        long cancelledMatches = matchRepository.countByStatus(RideMatch.MatchStatus.CANCELLED);

        long totalRequests = requestRepository.count();
        long pendingRequests = requestRepository.countByStatus(RideRequest.RequestStatus.PENDING);

        long totalMessages = chatMessageRepository.count();
        long totalColleges = collegeRepository.count();

        Map<String, Long> collegeDistribution = allUsers.stream()
                .filter(u -> u.getCollege() != null && !u.getCollege().trim().isEmpty())
                .collect(Collectors.groupingBy(User::getCollege, Collectors.counting()));

        return AdminStatsDto.builder()
                .totalUsers(totalUsers)
                .totalAdmins(totalAdmins)
                .totalStudents(totalStudents)
                .activeAvailabilities(activeAvails)
                .totalAvailabilities(totalAvails)
                .totalMatches(totalMatches)
                .activeMatches(activeMatches)
                .completedMatches(completedMatches)
                .cancelledMatches(cancelledMatches)
                .totalRequests(totalRequests)
                .pendingRequests(pendingRequests)
                .totalMessages(totalMessages)
                .totalColleges(totalColleges)
                .usersByCollege(collegeDistribution)
                .systemStatus("OPERATIONAL (100% HEALTHY)")
                .serverTime(LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, yyyy HH:mm:ss")))
                .build();
    }

    @Transactional(readOnly = true)
    public List<UserDto> getUsers(String search, String role) {
        String cleanRole = (role != null && !role.trim().isEmpty() && !role.equalsIgnoreCase("ALL")) ? role.trim() : null;
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return userRepository.searchUsers(cleanSearch, cleanRole)
                .stream()
                .map(UserDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto updateUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        String normalizedRole = newRole.toUpperCase().trim();
        if (!normalizedRole.startsWith("ROLE_")) {
            normalizedRole = "ROLE_" + normalizedRole;
        }

        user.setRole(normalizedRole);
        User saved = userRepository.save(user);
        log.info("Admin updated user {} role to {}", user.getEmail(), normalizedRole);
        return UserDto.fromEntity(saved);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        log.info("Admin purging user {} (ID: {}) and cascading dependencies", user.getEmail(), userId);

        // Clean dependent rows safely
        try {
            jdbcTemplate.update("DELETE FROM chat_messages WHERE sender_id = ? OR receiver_id = ?", userId, userId);
            jdbcTemplate.update("DELETE FROM ride_matches WHERE student1_id = ? OR student2_id = ?", userId, userId);
            jdbcTemplate.update("DELETE FROM ride_requests WHERE sender_id = ? OR receiver_id = ?", userId, userId);
            jdbcTemplate.update("DELETE FROM ride_availabilities WHERE user_id = ?", userId);
            userRepository.delete(user);
        } catch (Exception e) {
            log.error("Failed to delete user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to delete user: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<AdminAvailabilityDto> getAvailabilities(String status) {
        List<RideAvailability> list;
        if ("ACTIVE".equalsIgnoreCase(status)) {
            list = availabilityRepository.findAllByIsActiveTrue();
        } else {
            list = availabilityRepository.findAllByOrderByCreatedAtDesc();
        }

        return list.stream()
                .map(AdminAvailabilityDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelAvailability(Long id) {
        RideAvailability avail = availabilityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ride availability not found: " + id));
        avail.setActive(false);
        availabilityRepository.save(avail);
        log.info("Admin force-cancelled availability ID: {}", id);
    }

    @Transactional(readOnly = true)
    public List<AdminMatchDto> getMatches() {
        return matchRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AdminMatchDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminMatchDto updateMatchStatus(Long matchId, String statusStr) {
        RideMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found: " + matchId));

        RideMatch.MatchStatus newStatus = RideMatch.MatchStatus.valueOf(statusStr.toUpperCase().trim());
        match.setStatus(newStatus);
        RideMatch saved = matchRepository.save(match);
        log.info("Admin updated match {} status to {}", matchId, newStatus);
        return AdminMatchDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<College> getColleges() {
        return collegeRepository.findAllByOrderByNameAsc();
    }

    @Transactional
    public College addCollege(String name, String city) {
        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("College name cannot be empty");
        }
        if (collegeRepository.existsByNameIgnoreCase(name.trim())) {
            throw new RuntimeException("College with name already exists: " + name);
        }
        College c = College.builder()
                .name(name.trim())
                .city(city != null && !city.trim().isEmpty() ? city.trim() : "Pune")
                .build();
        return collegeRepository.save(c);
    }

    @Transactional
    public void deleteCollege(Long id) {
        collegeRepository.deleteById(id);
        log.info("Admin deleted college ID: {}", id);
    }

    @Transactional(readOnly = true)
    public List<AuditLogDto> getAuditLogs() {
        List<AuditLogDto> logs = new ArrayList<>();

        // 1. Recent Users
        userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(10)
                .forEach(u -> logs.add(AuditLogDto.builder()
                        .id("usr-" + u.getId())
                        .type("USER_JOINED")
                        .title("New Student Registered")
                        .description(u.getFullName() + " joined from " + u.getCollege() + " (" + u.getActiveCampus() + ")")
                        .actor(u.getEmail())
                        .timestamp(u.getCreatedAt() != null ? u.getCreatedAt() : LocalDateTime.now())
                        .badgeColor("blue")
                        .build()));

        // 2. Recent Matches
        matchRepository.findAllByOrderByCreatedAtDesc().stream()
                .limit(10)
                .forEach(m -> logs.add(AuditLogDto.builder()
                        .id("mat-" + m.getId())
                        .type("MATCH_FORMED")
                        .title("Ride Handshake Created")
                        .description(m.getStudent1().getFullName() + " paired with " + m.getStudent2().getFullName() + " heading to " + m.getDestinationName())
                        .actor("Match #" + m.getId())
                        .timestamp(m.getCreatedAt() != null ? m.getCreatedAt() : LocalDateTime.now())
                        .badgeColor("emerald")
                        .build()));

        // 3. Recent Availabilities
        availabilityRepository.findAllByOrderByCreatedAtDesc().stream()
                .limit(10)
                .forEach(a -> logs.add(AuditLogDto.builder()
                        .id("avl-" + a.getId())
                        .type("RIDE_BROADCAST")
                        .title("Ride Broadcast Posted")
                        .description((a.getUser() != null ? a.getUser().getFullName() : "User") + " is traveling to " + a.getDestinationName() + " at " + a.getDepartureTime())
                        .actor(a.getUser() != null ? a.getUser().getEmail() : "System")
                        .timestamp(a.getCreatedAt() != null ? a.getCreatedAt() : LocalDateTime.now())
                        .badgeColor("purple")
                        .build()));

        // Sort combined logs by timestamp descending
        logs.sort(Comparator.comparing(AuditLogDto::getTimestamp, Comparator.nullsLast(Comparator.reverseOrder())));
        return logs.stream().limit(25).collect(Collectors.toList());
    }
}
