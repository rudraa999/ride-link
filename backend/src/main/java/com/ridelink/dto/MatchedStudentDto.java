package com.ridelink.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchedStudentDto {
    private Long userId;
    private Long availabilityId;
    private String fullName;
    private String email;
    private String college;
    private String activeCampus;
    private String profileImageUrl;
    private String destinationName;
    private String departureTime;
    private double distanceKm;
    private String distanceFormatted; // e.g. "0.4 km (nearby)"
    private Boolean showProfile;
    private Boolean showPreciseDistance;
}
