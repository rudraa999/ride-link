package com.ridelink.repository;

import com.ridelink.model.RideMatch;
import com.ridelink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RideMatchRepository extends JpaRepository<RideMatch, Long> {

    @Query("SELECT m FROM RideMatch m WHERE (m.student1 = :user OR m.student2 = :user) ORDER BY m.createdAt DESC")
    List<RideMatch> findAllForUser(@Param("user") User user);

    @Query("SELECT m FROM RideMatch m WHERE (m.student1 = :user OR m.student2 = :user) AND m.status = :status ORDER BY m.createdAt DESC")
    List<RideMatch> findForUserByStatus(@Param("user") User user, @Param("status") RideMatch.MatchStatus status);

    @Query("SELECT m FROM RideMatch m WHERE (m.student1 = :user OR m.student2 = :user) AND m.status = com.ridelink.model.RideMatch.MatchStatus.ACTIVE ORDER BY m.createdAt DESC")
    List<RideMatch> findActiveMatchesForUser(@Param("user") User user);

    @Query("SELECT m FROM RideMatch m WHERE m.id = :matchId AND (m.student1 = :user OR m.student2 = :user)")
    Optional<RideMatch> findByIdAndUser(@Param("matchId") Long matchId, @Param("user") User user);
}
