package com.ridelink.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendRideRequestDto {
    @NotNull(message = "Target availability ID is required")
    private Long targetAvailabilityId;
    private String note;
}
