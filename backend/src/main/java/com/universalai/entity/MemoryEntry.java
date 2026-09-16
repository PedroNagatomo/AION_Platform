package com.universalai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "memory_entries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemoryEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String category; // note, conversation, file, contact, reminder, spreadsheet, chart

    @Column(nullable = false)
    private String topic; // Tópico principal (ex: "marketing", "projeto X", "cliente Y")

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content; // Conteúdo da memória

    @Column(length = 500)
    private String keywords; // Palavras-chave para busca

    @Column(name = "source_type")
    private String sourceType; // Qual módulo originou

    @Column(name = "source_id")
    private UUID sourceId; // ID do item original

    @Column(name = "importance")
    private Integer importance; // 1-5, quão importante

    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}