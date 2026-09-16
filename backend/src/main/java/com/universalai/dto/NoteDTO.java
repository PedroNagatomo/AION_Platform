package com.universalai.dto;

import com.universalai.entity.Note;
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
public class NoteDTO {
    private UUID id;
    private String title;
    private String content;
    private UUID parentId;
    private Boolean isFolder;
    private String tags;
    private String icon;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NoteDTO fromEntity(Note note) {
        return NoteDTO.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .parentId(note.getParentId())
                .isFolder(note.getIsFolder() != null ? note.getIsFolder() : false)
                .tags(note.getTags())
                .icon(note.getIcon())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}