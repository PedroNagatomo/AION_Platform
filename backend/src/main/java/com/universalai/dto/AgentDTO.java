package com.universalai.dto;

import com.universalai.entity.Agent;
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
public class AgentDTO {
    private UUID id;
    private String name;
    private String icon;
    private String description;
    private String systemPrompt;
    private Boolean isDefault;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static AgentDTO fromEntity(Agent agent) {
        return AgentDTO.builder()
                .id(agent.getId())
                .name(agent.getName())
                .icon(agent.getIcon())
                .description(agent.getDescription())
                .systemPrompt(agent.getSystemPrompt())
                .isDefault(agent.getIsDefault())
                .isActive(agent.getIsActive())
                .createdAt(agent.getCreatedAt())
                .build();
    }
}