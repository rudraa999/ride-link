package com.ridelink.service;

import com.ridelink.dto.ChatMessageDto;
import com.ridelink.model.ChatMessage;
import com.ridelink.model.RideMatch;
import com.ridelink.model.User;
import com.ridelink.repository.ChatMessageRepository;
import com.ridelink.repository.RideMatchRepository;
import com.ridelink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final RideMatchRepository matchRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessagesForMatch(Long userId, Long matchId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        RideMatch match = matchRepository.findByIdAndUser(matchId, user)
                .orElseThrow(() -> new RuntimeException("Match not found: " + matchId));

        return chatMessageRepository.findByMatchOrderByTimestampAsc(match)
                .stream()
                .map(ChatMessageDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ChatMessageDto sendMessage(Long userId, Long matchId, String content) {
        if (content == null || content.trim().isEmpty()) {
            throw new RuntimeException("Message content cannot be empty");
        }

        User sender = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        RideMatch match = matchRepository.findByIdAndUser(matchId, sender)
                .orElseThrow(() -> new RuntimeException("Match not found: " + matchId));

        User receiver = match.getStudent1().getId().equals(sender.getId()) ? match.getStudent2() : match.getStudent1();

        ChatMessage chatMessage = ChatMessage.builder()
                .match(match)
                .sender(sender)
                .receiver(receiver)
                .content(content.trim())
                .build();

        ChatMessage saved = chatMessageRepository.save(chatMessage);
        ChatMessageDto dto = ChatMessageDto.fromEntity(saved);

        // Broadcast to WebSocket topic for this match
        try {
            messagingTemplate.convertAndSend("/topic/match/" + matchId + "/chat", dto);
        } catch (Exception e) {
            log.warn("WebSocket chat broadcast failed: {}", e.getMessage());
        }

        return dto;
    }
}
