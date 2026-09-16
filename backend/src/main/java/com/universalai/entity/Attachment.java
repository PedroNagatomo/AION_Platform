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
@Table(name = "attachments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id")
    private Message message;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType; // image/png, application/pdf, text/plain, etc.

    @Column(nullable = false)
    private Long fileSize;

    @Column(columnDefinition = "TEXT")
    private String content; // Conteúdo texto extraído (para arquivos de texto)

    @Column(name = "storage_path")
    private String storagePath; // Caminho onde o arquivo foi salvo

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}