package com.ridelink.repository;

import com.ridelink.model.RideAvailability;
import com.ridelink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RideAvailabilityRepository extends JpaRepository<RideAvailability, Long> {

    Optional<RideAvailability> findByUserAndIsActiveTrue(User user);

    List<RideAvailability> findAllByIsActiveTrue();

    @Query("SELECT r FROM RideAvailability r WHERE r.isActive = true AND r.user.id != :userId")
    List<RideAvailability> findActiveExcludingUser(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE RideAvailability r SET r.isActive = false WHERE r.user = :user")
    void deactivateAllForUser(@Param("user") User user);

    @Modifying
    @Query("UPDATE RideAvailability r SET r.isActive = false WHERE r.isActive = true AND r.expiresAt <= :now")
    int deactivateExpired(@Param("now") LocalDateTime now);
}
