package com.universalai.dto;

import com.universalai.entity.Whiteboard;
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
public class WhiteboardDTO {
    private UUID id;
    private String name;
    private String data;
    private String icon;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static WhiteboardDTO fromEntity(Whiteboard whiteboard) {
        return WhiteboardDTO.builder()
                .id(whiteboard.getId())
                .name(whiteboard.getName())
                .data(whiteboard.getData())
                .icon(whiteboard.getIcon())
                .createdAt(whiteboard.getCreatedAt())
                .updatedAt(whiteboard.getUpdatedAt())
                .build();
    }
}