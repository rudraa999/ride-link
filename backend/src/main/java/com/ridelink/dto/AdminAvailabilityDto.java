package com.ridelink.dto;

import com.ridelink.model.RideAvailability;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminAvailabilityDto {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String college;
    private String campusName;
    private String destinationName;
    private Double latitude;
    private Double longitude;
    private String departureTime;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    public static AdminAvailabilityDto fromEntity(RideAvailability entity) {
        if (entity == null) return null;
        return AdminAvailabilityDto.builder()
                .id(entity.getId())
                .userId(entity.getUser() != null ? entity.getUser().getId() : null)
                .userName(entity.getUser() != null ? entity.getUser().getFullName() : "Unknown")
                .userEmail(entity.getUser() != null ? entity.getUser().getEmail() : "N/A")
                .college(entity.getUser() != null ? entity.getUser().getCollege() : "N/A")
                .campusName(entity.getCampusName())
                .destinationName(entity.getDestinationName())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .departureTime(entity.getDepartureTime())
                .active(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .expiresAt(entity.getExpiresAt())
                .build();
    }
}
