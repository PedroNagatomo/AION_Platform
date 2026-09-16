package com.universalai.dto;

import com.universalai.entity.UserFile;
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
public class UserFileDTO {
    private UUID id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String folderName;
    private Boolean isFavorite;
    private String thumbnail;
    private LocalDateTime createdAt;

    public static UserFileDTO fromEntity(UserFile file) {
        return UserFileDTO.builder()
                .id(file.getId())
                .fileName(file.getFileName())
                .fileType(file.getFileType())
                .fileSize(file.getFileSize())
                .folderName(file.getFolderName())
                .isFavorite(file.getIsFavorite() != null ? file.getIsFavorite() : false)
                .thumbnail(file.getThumbnail())
                .createdAt(file.getCreatedAt())
                .build();
    }
}