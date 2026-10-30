package com.ridelink.dto;

import com.ridelink.model.RideMatch;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminMatchDto {
    private Long id;
    private Long requestId;
    private Long student1Id;
    private String student1Name;
    private String student1Email;
    private Long student2Id;
    private String student2Name;
    private String student2Email;
    private String campusName;
    private String destinationName;
    private String departureTime;
    private String status;
    private LocalDateTime createdAt;

    public static AdminMatchDto fromEntity(RideMatch m) {
        if (m == null) return null;
        return AdminMatchDto.builder()
                .id(m.getId())
                .requestId(m.getRequest() != null ? m.getRequest().getId() : null)
                .student1Id(m.getStudent1() != null ? m.getStudent1().getId() : null)
                .student1Name(m.getStudent1() != null ? m.getStudent1().getFullName() : "N/A")
                .student1Email(m.getStudent1() != null ? m.getStudent1().getEmail() : "N/A")
                .student2Id(m.getStudent2() != null ? m.getStudent2().getId() : null)
                .student2Name(m.getStudent2() != null ? m.getStudent2().getFullName() : "N/A")
                .student2Email(m.getStudent2() != null ? m.getStudent2().getEmail() : "N/A")
                .campusName(m.getCampusName())
                .destinationName(m.getDestinationName())
                .departureTime(m.getDepartureTime())
                .status(m.getStatus() != null ? m.getStatus().name() : "UNKNOWN")
                .createdAt(m.getCreatedAt())
                .build();
    }
}
