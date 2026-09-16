package com.universalai.dto;

import com.universalai.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private UUID id;
    private String role;
    private String content;
    private LocalDateTime createdAt;

    public static MessageResponse fromEntity(Message message) {
        return MessageResponse.builder()
                .id(message.getId())
                .role(message.getRole().toString())
                .content(message.getContent())
                .createdAt(message.getCreatedAt())
                .build();
    }
}