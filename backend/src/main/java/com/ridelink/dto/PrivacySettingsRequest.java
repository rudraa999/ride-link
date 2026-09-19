package com.ridelink.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrivacySettingsRequest {
    private Boolean showProfile;
    private Boolean showPhonePostMatch;
    private Boolean showPreciseDistance;
    private Boolean showRideStats;
}
