package com.ridelink.repository;

import com.ridelink.model.ChatMessage;
import com.ridelink.model.RideMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByMatchOrderByTimestampAsc(RideMatch match);
    List<ChatMessage> findByMatchIdOrderByTimestampAsc(Long matchId);
}
