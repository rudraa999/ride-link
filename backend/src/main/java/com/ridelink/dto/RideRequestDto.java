package com.ridelink.dto;

import com.ridelink.model.RideRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RideRequestDto {
    private Long id;
    private UserDto sender;
    private UserDto receiver;
    private String fromCampus;
    private String toDestination;
    private String departureTime;
    private String note;
    private RideRequest.RequestStatus status;
    private LocalDateTime createdAt;
    private Long matchId;

    public static RideRequestDto fromEntity(RideRequest req, Long matchId) {
        if (req == null) return null;
        String fromCampus = req.getSenderAvailability() != null ? req.getSenderAvailability().getCampusName() : req.getSender().getActiveCampus();
        String toDest = req.getSenderAvailability() != null ? req.getSenderAvailability().getDestinationName() : "";
        String depTime = req.getSenderAvailability() != null ? req.getSenderAvailability().getDepartureTime() : "";

        return RideRequestDto.builder()
                .id(req.getId())
                .sender(UserDto.fromEntity(req.getSender()))
                .receiver(UserDto.fromEntity(req.getReceiver()))
                .fromCampus(fromCampus)
                .toDestination(toDest)
                .departureTime(depTime)
                .note(req.getNote())
                .status(req.getStatus())
                .createdAt(req.getCreatedAt())
                .matchId(matchId)
                .build();
    }
}
