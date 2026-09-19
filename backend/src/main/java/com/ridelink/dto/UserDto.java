package com.ridelink.dto;

import com.ridelink.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {
    private Long id;
    private String fullName;
    private String email;
    private String college;
    private String activeCampus;
    private String phone;
    private String profileImageUrl;
    private Boolean showProfile;
    private Boolean showPhonePostMatch;
    private Boolean showPreciseDistance;
    private Boolean showRideStats;

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .college(user.getCollege())
                .activeCampus(user.getActiveCampus())
                .phone(user.getPhone())
                .profileImageUrl(user.getProfileImageUrl())
                .showProfile(user.getShowProfile() != null ? user.getShowProfile() : true)
                .showPhonePostMatch(user.getShowPhonePostMatch() != null ? user.getShowPhonePostMatch() : true)
                .showPreciseDistance(user.getShowPreciseDistance() != null ? user.getShowPreciseDistance() : true)
                .showRideStats(user.getShowRideStats() != null ? user.getShowRideStats() : true)
                .build();
    }
}
