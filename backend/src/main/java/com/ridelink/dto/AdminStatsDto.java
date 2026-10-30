package com.ridelink.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStatsDto {
    private long totalUsers;
    private long totalAdmins;
    private long totalStudents;
    private long activeAvailabilities;
    private long totalAvailabilities;
    private long totalMatches;
    private long activeMatches;
    private long completedMatches;
    private long cancelledMatches;
    private long totalRequests;
    private long pendingRequests;
    private long totalMessages;
    private long totalColleges;
    private Map<String, Long> usersByCollege;
    private String systemStatus;
    private String serverTime;
}
