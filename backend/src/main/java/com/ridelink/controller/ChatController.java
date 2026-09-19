package com.ridelink.controller;

import com.ridelink.dto.ChatMessageDto;
import com.ridelink.security.UserPrincipal;
import com.ridelink.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/matches/{matchId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getMessages(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long matchId) {
        return ResponseEntity.ok(chatService.getMessagesForMatch(currentUser.getId(), matchId));
    }

    @PostMapping("/matches/{matchId}/messages")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long matchId,
            @RequestBody Map<String, String> payload) {
        String content = payload.get("content");
        return ResponseEntity.ok(chatService.sendMessage(currentUser.getId(), matchId, content));
    }

    @MessageMapping("/chat.send/{matchId}")
    public void processChatMessage(@DestinationVariable Long matchId, @Payload Map<String, Object> payload) {
        Long senderId = Long.valueOf(payload.get("senderId").toString());
        String content = (String) payload.get("content");
        chatService.sendMessage(senderId, matchId, content);
    }
}
