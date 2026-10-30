package com.ridelink.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDto {
    private String id;
    private String type;
    private String title;
    private String description;
    private String actor;
    private LocalDateTime timestamp;
    private String badgeColor;
}
