package com.ridelink.dto;

import com.ridelink.model.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {
    private Long id;
    private Long matchId;
    private Long senderId;
    private String senderName;
    private Long receiverId;
    private String content;
    private LocalDateTime timestamp;
    private String formattedTime;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("h:mm a");

    public static ChatMessageDto fromEntity(ChatMessage msg) {
        if (msg == null) return null;
        String timeStr = "";
        if (msg.getTimestamp() != null) {
            timeStr = msg.getTimestamp().format(TIME_FORMATTER);
        }
        return ChatMessageDto.builder()
                .id(msg.getId())
                .matchId(msg.getMatch().getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getFullName())
                .receiverId(msg.getReceiver().getId())
                .content(msg.getContent())
                .timestamp(msg.getTimestamp())
                .formattedTime(timeStr)
                .build();
    }
}
