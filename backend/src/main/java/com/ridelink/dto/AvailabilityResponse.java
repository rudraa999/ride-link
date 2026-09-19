package com.ridelink.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ridelink.model.RideAvailability;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AvailabilityResponse {
    private Long id;
    private Long userId;
    private String campusName;
    private String destinationName;
    private Double latitude;
    private Double longitude;
    private String departureTime;

    @JsonProperty("isActive")
    private boolean isActive;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private long remainingSeconds;

    public static AvailabilityResponse fromEntity(RideAvailability entity) {
        if (entity == null) return null;
        long remaining = 0;
        if (entity.isActive() && entity.getExpiresAt() != null) {
            remaining = Math.max(0, Duration.between(LocalDateTime.now(), entity.getExpiresAt()).getSeconds());
        }
        return AvailabilityResponse.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .campusName(entity.getCampusName())
                .destinationName(entity.getDestinationName())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .departureTime(entity.getDepartureTime())
                .isActive(entity.isActive())
                .createdAt(entity.getCreatedAt())
                .expiresAt(entity.getExpiresAt())
                .remainingSeconds(remaining)
                .build();
    }
}
