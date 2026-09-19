package com.ridelink.dto;

import com.ridelink.model.RideMatch;
import com.ridelink.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideMatchDto {
    private Long id;
    private UserDto otherStudent;
    private String campusName;
    private String destinationName;
    private String departureTime;
    private RideMatch.MatchStatus status;
    private LocalDateTime createdAt;

    public static RideMatchDto fromEntity(RideMatch match, User currentUser) {
        if (match == null) return null;
        User other = match.getStudent1().getId().equals(currentUser.getId()) ? match.getStudent2() : match.getStudent1();
        return RideMatchDto.builder()
                .id(match.getId())
                .otherStudent(UserDto.fromEntity(other))
                .campusName(match.getCampusName())
                .destinationName(match.getDestinationName())
                .departureTime(match.getDepartureTime())
                .status(match.getStatus())
                .createdAt(match.getCreatedAt())
                .build();
    }
}
