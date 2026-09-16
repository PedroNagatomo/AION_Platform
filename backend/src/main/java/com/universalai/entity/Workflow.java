package com.universalai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "workflows")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Workflow {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String icon;

    @Column(nullable = false)
    private Boolean isActive;

    // TRIGGER - quando executar
    @Column(name = "trigger_type", nullable = false, length = 50)
    private String triggerType; // NOTE_CREATED, CONTACT_CREATED, EVENT_STARTING, SCHEDULE, etc.

    @Column(name = "trigger_config", columnDefinition = "TEXT")
    private String triggerConfig; // JSON com configuração do trigger

    // CONDITIONS - filtros opcionais
    @Column(name = "conditions", columnDefinition = "TEXT")
    private String conditions; // JSON array de condições

    // ACTIONS - o que fazer
    @Column(name = "actions", columnDefinition = "TEXT", nullable = false)
    private String actions; // JSON array de ações

    // Estatísticas
    @Column(name = "execution_count")
    @Builder.Default
    private Long executionCount = 0L;

    @Column(name = "last_executed_at")
    private LocalDateTime lastExecutedAt;

    @Column(name = "last_execution_status", length = 20)
    private String lastExecutionStatus; // SUCCESS, FAILED

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}