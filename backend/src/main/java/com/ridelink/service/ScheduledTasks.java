package com.ridelink.service;

import com.ridelink.repository.RideAvailabilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class ScheduledTasks {

    private final RideAvailabilityRepository availabilityRepository;

    /**
     * Runs every 30 seconds to automatically expire unmatched availabilities older than 60 minutes.
     */
    @Scheduled(fixedRate = 30000)
    @Transactional
    public void cleanupExpiredAvailabilities() {
        int count = availabilityRepository.deactivateExpired(LocalDateTime.now());
        if (count > 0) {
            log.info("Automatically expired {} unmatched ride availabilities", count);
        }
    }
}
