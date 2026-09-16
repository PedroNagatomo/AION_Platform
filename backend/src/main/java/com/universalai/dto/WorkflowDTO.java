package com.universalai.dto;

import com.universalai.entity.Workflow;
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
public class WorkflowDTO {
    private UUID id;
    private String name;
    private String description;
    private String icon;
    private Boolean isActive;
    private String triggerType;
    private String triggerConfig;
    private String conditions;
    private String actions;
    private Long executionCount;
    private LocalDateTime lastExecutedAt;
    private String lastExecutionStatus;
    private LocalDateTime createdAt;

    public static WorkflowDTO fromEntity(Workflow w) {
        return WorkflowDTO.builder()
                .id(w.getId())
                .name(w.getName())
                .description(w.getDescription())
                .icon(w.getIcon())
                .isActive(w.getIsActive())
                .triggerType(w.getTriggerType())
                .triggerConfig(w.getTriggerConfig())
                .conditions(w.getConditions())
                .actions(w.getActions())
                .executionCount(w.getExecutionCount())
                .lastExecutedAt(w.getLastExecutedAt())
                .lastExecutionStatus(w.getLastExecutionStatus())
                .createdAt(w.getCreatedAt())
                .build();
    }
}