package com.ridelink.repository;

import com.ridelink.model.RideRequest;
import com.ridelink.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RideRequestRepository extends JpaRepository<RideRequest, Long> {

    List<RideRequest> findByReceiverAndStatus(User receiver, RideRequest.RequestStatus status);

    List<RideRequest> findBySenderAndStatus(User sender, RideRequest.RequestStatus status);

    @Query("SELECT r FROM RideRequest r WHERE (r.sender = :user OR r.receiver = :user) ORDER BY r.createdAt DESC")
    List<RideRequest> findAllForUser(@Param("user") User user);

    @Query("SELECT r FROM RideRequest r WHERE r.sender = :sender AND r.receiver = :receiver AND r.status = 'PENDING'")
    Optional<RideRequest> findPendingRequest(@Param("sender") User sender, @Param("receiver") User receiver);
}
