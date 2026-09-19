package com.ridelink.service;

import com.ridelink.dto.RideMatchDto;
import com.ridelink.dto.RideRequestDto;
import com.ridelink.dto.SendRideRequestDto;
import com.ridelink.model.RideAvailability;
import com.ridelink.model.RideMatch;
import com.ridelink.model.RideRequest;
import com.ridelink.model.User;
import com.ridelink.repository.RideAvailabilityRepository;
import com.ridelink.repository.RideMatchRepository;
import com.ridelink.repository.RideRequestRepository;
import com.ridelink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RequestService {

    private final RideRequestRepository requestRepository;
    private final RideAvailabilityRepository availabilityRepository;
    private final RideMatchRepository matchRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public RideRequestDto sendRideRequest(Long senderId, SendRideRequestDto dto) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found: " + senderId));

        RideAvailability targetAvail = availabilityRepository.findById(dto.getTargetAvailabilityId())
                .orElseThrow(() -> new RuntimeException("Target availability not found"));

        if (!targetAvail.isActive()) {
            throw new RuntimeException("Target student is no longer available");
        }

        User receiver = targetAvail.getUser();
        if (sender.getId().equals(receiver.getId())) {
            throw new RuntimeException("Cannot send request to yourself");
        }

        RideAvailability senderAvail = availabilityRepository.findByUserAndIsActiveTrue(sender)
                .orElse(null);

        String note = dto.getNote();
        if (note == null || note.trim().isEmpty()) {
            String dest = targetAvail.getDestinationName();
            note = "Hey! I'm also heading to " + dest + ". Let's catch a ride together!";
        }

        RideRequest request = RideRequest.builder()
                .sender(sender)
                .receiver(receiver)
                .senderAvailability(senderAvail)
                .receiverAvailability(targetAvail)
                .status(RideRequest.RequestStatus.PENDING)
                .note(note)
                .build();

        RideRequest saved = requestRepository.save(request);
        RideRequestDto requestDto = RideRequestDto.fromEntity(saved, null);

        // Send real-time notification to receiver
        try {
            messagingTemplate.convertAndSend("/topic/user/" + receiver.getId() + "/requests", requestDto);
        } catch (Exception e) {
            log.warn("WebSocket notification to receiver failed: {}", e.getMessage());
        }

        return requestDto;
    }

    @Transactional
    public RideMatchDto acceptRideRequest(Long receiverId, Long requestId) {
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("User not found: " + receiverId));

        RideRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found: " + requestId));

        if (!request.getReceiver().getId().equals(receiverId)) {
            throw new RuntimeException("Not authorized to accept this request");
        }

        if (request.getStatus() != RideRequest.RequestStatus.PENDING) {
            throw new RuntimeException("Request has already been processed: " + request.getStatus());
        }

        // 1. Mark request ACCEPTED
        request.setStatus(RideRequest.RequestStatus.ACCEPTED);
        requestRepository.save(request);

        User sender = request.getSender();

        // 2. Automatically turn OFF both students' availability
        availabilityRepository.deactivateAllForUser(sender);
        availabilityRepository.deactivateAllForUser(receiver);

        // 3. Create RideMatch record
        String campus = request.getSenderAvailability() != null ? request.getSenderAvailability().getCampusName() : sender.getActiveCampus();
        String destination = request.getSenderAvailability() != null ? request.getSenderAvailability().getDestinationName() : "Destination";
        String departureTime = request.getSenderAvailability() != null ? request.getSenderAvailability().getDepartureTime() : "Today";

        RideMatch match = RideMatch.builder()
                .request(request)
                .student1(sender)
                .student2(receiver)
                .campusName(campus)
                .destinationName(destination)
                .departureTime(departureTime)
                .status(RideMatch.MatchStatus.ACTIVE)
                .build();

        RideMatch savedMatch = matchRepository.save(match);

        RideMatchDto senderDto = RideMatchDto.fromEntity(savedMatch, sender);
        RideMatchDto receiverDto = RideMatchDto.fromEntity(savedMatch, receiver);

        // 4. Send real-time match events to both users
        try {
            messagingTemplate.convertAndSend("/topic/user/" + sender.getId() + "/matches",
                    Map.of("type", "MATCH_ACCEPTED", "match", senderDto));
            messagingTemplate.convertAndSend("/topic/user/" + receiver.getId() + "/matches",
                    Map.of("type", "MATCH_ACCEPTED", "match", receiverDto));
        } catch (Exception e) {
            log.warn("WebSocket match broadcast error: {}", e.getMessage());
        }

        return receiverDto;
    }

    @Transactional
    public void rejectRideRequest(Long receiverId, Long requestId) {
        RideRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found: " + requestId));

        if (!request.getReceiver().getId().equals(receiverId)) {
            throw new RuntimeException("Not authorized to reject this request");
        }

        request.setStatus(RideRequest.RequestStatus.REJECTED);
        requestRepository.save(request);

        try {
            messagingTemplate.convertAndSend("/topic/user/" + request.getSender().getId() + "/requests",
                    Map.of("type", "REQUEST_REJECTED", "requestId", requestId));
        } catch (Exception e) {
            log.warn("WebSocket rejection broadcast error: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<RideRequestDto> getIncomingPendingRequests(Long userId) {
        User receiver = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        return requestRepository.findByReceiverAndStatus(receiver, RideRequest.RequestStatus.PENDING)
                .stream()
                .map(r -> RideRequestDto.fromEntity(r, null))
                .collect(Collectors.toList());
    }
}
