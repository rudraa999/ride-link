package com.ridelink.service;

import com.ridelink.dto.AvailabilityRequest;
import com.ridelink.dto.AvailabilityResponse;
import com.ridelink.dto.MatchedStudentDto;
import com.ridelink.model.RideAvailability;
import com.ridelink.model.User;
import com.ridelink.repository.RideAvailabilityRepository;
import com.ridelink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AvailabilityService {

    private final RideAvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;
    private final DistanceService distanceService;

    @Transactional
    public AvailabilityResponse startAvailability(Long userId, AvailabilityRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Deactivate previous active availabilities for this user
        availabilityRepository.deactivateAllForUser(user);

        // Active campus update if requested differently
        if (request.getCampusName() != null && !request.getCampusName().trim().isEmpty()) {
            user.setActiveCampus(request.getCampusName().trim());
            userRepository.save(user);
        }

        LocalDateTime now = LocalDateTime.now();
        RideAvailability availability = RideAvailability.builder()
                .user(user)
                .campusName(request.getCampusName().trim())
                .destinationName(request.getDestinationName().trim())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .departureTime(request.getDepartureTime().trim())
                .isActive(true)
                .createdAt(now)
                .expiresAt(now.plusMinutes(60))
                .build();

        RideAvailability saved = availabilityRepository.save(availability);
        return AvailabilityResponse.fromEntity(saved);
    }

    @Transactional
    public void stopAvailability(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        availabilityRepository.deactivateAllForUser(user);
    }

    @Transactional(readOnly = true)
    public Optional<AvailabilityResponse> getCurrentAvailability(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        return availabilityRepository.findByUserAndIsActiveTrue(user)
                .filter(avail -> avail.getExpiresAt() != null && avail.getExpiresAt().isAfter(LocalDateTime.now()))
                .map(AvailabilityResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<MatchedStudentDto> findMatchingStudents(Long userId) {
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Optional<RideAvailability> myAvailabilityOpt = availabilityRepository.findByUserAndIsActiveTrue(currentUser)
                .filter(avail -> avail.getExpiresAt() != null && avail.getExpiresAt().isAfter(LocalDateTime.now()));

        if (myAvailabilityOpt.isEmpty()) {
            return new ArrayList<>();
        }

        RideAvailability myAvail = myAvailabilityOpt.get();
        List<RideAvailability> otherAvails = availabilityRepository.findActiveExcludingUser(userId);

        List<MatchedStudentDto> matches = new ArrayList<>();

        for (RideAvailability other : otherAvails) {
            if (other.getExpiresAt() == null || !other.getExpiresAt().isAfter(LocalDateTime.now())) {
                continue;
            }

            // Campus check (same campus or flexible match)
            boolean campusMatch = isCampusCompatible(myAvail.getCampusName(), other.getCampusName(),
                    currentUser.getCollege(), other.getUser().getCollege());

            if (!campusMatch) {
                continue;
            }

            // Haversine distance calculation in KM
            double distanceKm = distanceService.calculateDistance(
                    myAvail.getLatitude(), myAvail.getLongitude(),
                    other.getLatitude(), other.getLongitude()
            );

            // Match if destination within 1.0 km (or destination name substring match)
            boolean isNearby = distanceKm <= 1.0;
            if (!isNearby) {
                // If same named destination location (case-insensitive substring)
                if (isDestinationNameSimilar(myAvail.getDestinationName(), other.getDestinationName())) {
                    isNearby = true;
                    distanceKm = Math.min(distanceKm, 0.5);
                }
            }

            if (isNearby) {
                User otherUser = other.getUser();
                boolean showProfile = otherUser.getShowProfile() != null ? otherUser.getShowProfile() : true;
                boolean showPrecise = otherUser.getShowPreciseDistance() != null ? otherUser.getShowPreciseDistance() : true;
                String formattedDistance = showPrecise
                        ? String.format(Locale.US, "%.1f km (nearby)", distanceKm)
                        : "Nearby (< 1 km)";

                matches.add(MatchedStudentDto.builder()
                        .userId(otherUser.getId())
                        .availabilityId(other.getId())
                        .fullName(showProfile ? otherUser.getFullName() : "Campus Peer")
                        .email(showProfile ? otherUser.getEmail() : null)
                        .college(otherUser.getCollege())
                        .activeCampus(otherUser.getActiveCampus())
                        .profileImageUrl(showProfile ? otherUser.getProfileImageUrl() : null)
                        .destinationName(other.getDestinationName())
                        .departureTime(other.getDepartureTime())
                        .distanceKm(distanceKm)
                        .distanceFormatted(formattedDistance)
                        .showProfile(showProfile)
                        .showPreciseDistance(showPrecise)
                        .build());
            }
        }

        return matches;
    }

    private boolean isCampusCompatible(String campus1, String campus2, String college1, String college2) {
        if (campus1 == null || campus2 == null) return true;
        String c1 = campus1.toLowerCase().trim();
        String c2 = campus2.toLowerCase().trim();
        if (c1.equals(c2) || c1.contains(c2) || c2.contains(c1)) return true;
        if (college1 != null && college2 != null && college1.equalsIgnoreCase(college2)) return true;
        return false;
    }

    private boolean isDestinationNameSimilar(String d1, String d2) {
        if (d1 == null || d2 == null) return false;
        String s1 = d1.toLowerCase().trim();
        String s2 = d2.toLowerCase().trim();
        return s1.contains(s2) || s2.contains(s1);
    }
}
