package com.universalai.service;

import com.universalai.dto.UserFileDTO;
import com.universalai.entity.User;
import com.universalai.entity.UserFile;
import com.universalai.repository.UserFileRepository;
import com.universalai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileManagerService {

    private final UserFileRepository userFileRepository;
    private final UserRepository userRepository;

    @Transactional
    public List<UserFileDTO> uploadFiles(UUID userId, MultipartFile[] files, String folderName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<UserFileDTO> uploadedFiles = new ArrayList<>();

        for (MultipartFile file : files) {
            try {
                String thumbnail = null;

                // Gerar thumbnail para imagens
                if (file.getContentType() != null && file.getContentType().startsWith("image/")) {
                    byte[] bytes = file.getBytes();
                    thumbnail = "data:" + file.getContentType() + ";base64," +
                            Base64.getEncoder().encodeToString(bytes);
                }

                UserFile userFile = UserFile.builder()
                        .user(user)
                        .fileName(file.getOriginalFilename())
                        .fileType(file.getContentType())
                        .fileSize(file.getSize())
                        .folderName(folderName)
                        .isFavorite(false)
                        .thumbnail(thumbnail)
                        .build();

                uploadedFiles.add(UserFileDTO.fromEntity(userFileRepository.save(userFile)));
            } catch (IOException e) {
                log.error("Error uploading file: {}", file.getOriginalFilename(), e);
            }
        }

        return uploadedFiles;
    }

    @Transactional(readOnly = true)
    public List<UserFileDTO> getUserFiles(UUID userId, String folderName) {
        if (folderName != null && !folderName.isEmpty()) {
            return userFileRepository.findByUserIdAndFolderNameOrderByCreatedAtDesc(userId, folderName)
                    .stream().map(UserFileDTO::fromEntity).collect(Collectors.toList());
        }
        return userFileRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(UserFileDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserFileDTO> getFavoriteFiles(UUID userId) {
        return userFileRepository.findByUserIdAndIsFavoriteTrueOrderByCreatedAtDesc(userId)
                .stream().map(UserFileDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public void toggleFavorite(UUID fileId, UUID userId) {
        UserFile file = userFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        file.setIsFavorite(!Boolean.TRUE.equals(file.getIsFavorite()));
        userFileRepository.save(file);
    }

    @Transactional
    public void moveToFolder(UUID fileId, UUID userId, String folderName) {
        UserFile file = userFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        file.setFolderName(folderName);
        userFileRepository.save(file);
    }

    @Transactional
    public void deleteFile(UUID fileId, UUID userId) {
        UserFile file = userFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (!file.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        userFileRepository.delete(file);
    }

    @Transactional(readOnly = true)
    public List<String> getFolders(UUID userId) {
        return userFileRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(UserFile::getFolderName)
                .filter(name -> name != null && !name.isEmpty())
                .distinct()
                .collect(Collectors.toList());
    }
}