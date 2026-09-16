package com.universalai.controller;

import com.universalai.dto.UserFileDTO;
import com.universalai.entity.User;
import com.universalai.repository.UserRepository;
import com.universalai.service.AdvancedMemoryService;
import com.universalai.service.FileManagerService;
import com.universalai.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // ADICIONAR
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j // ADICIONAR ISSO
public class FileManagerController {

    private final FileManagerService fileManagerService;
    private final UserRepository userRepository;
    private final AdvancedMemoryService advancedMemoryService;
    private final WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<List<UserFileDTO>> getFiles(@RequestParam(required = false) String folder) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(fileManagerService.getUserFiles(userId, folder));
    }

    @GetMapping("/favorites")
    public ResponseEntity<List<UserFileDTO>> getFavorites() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(fileManagerService.getFavoriteFiles(userId));
    }

    @GetMapping("/folders")
    public ResponseEntity<List<String>> getFolders() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(fileManagerService.getFolders(userId));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<List<UserFileDTO>> uploadFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "folder", required = false) String folder) {
        UUID userId = getCurrentUserId();
        List<UserFileDTO> uploadedFiles = fileManagerService.uploadFiles(userId, files, folder);

        for (UserFileDTO file : uploadedFiles) {
            advancedMemoryService.indexFile(file.getId(), userId);

            log.info("📁 File uploaded: {}", file.getFileName());

            // DISPARAR WORKFLOW - FILE_UPLOADED
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("id", file.getId().toString());
            eventData.put("fileName", file.getFileName());
            eventData.put("fileType", file.getFileType() != null ? file.getFileType() : "");
            eventData.put("fileSize", file.getFileSize());
            eventData.put("folder", file.getFolderName() != null ? file.getFolderName() : "");
            eventData.put("category", "file");

            log.info("📤 Triggering FILE_UPLOADED with: {}", eventData);
            workflowService.triggerWorkflows(userId, "FILE_UPLOADED", eventData);
        }

        return ResponseEntity.ok(uploadedFiles);
    }

    @PostMapping("/{fileId}/favorite")
    public ResponseEntity<Void> toggleFavorite(@PathVariable UUID fileId) {
        UUID userId = getCurrentUserId();
        fileManagerService.toggleFavorite(fileId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{fileId}/move")
    public ResponseEntity<Void> moveToFolder(@PathVariable UUID fileId, @RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        fileManagerService.moveToFolder(fileId, userId, request.get("folder"));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable UUID fileId) {
        UUID userId = getCurrentUserId();
        fileManagerService.deleteFile(fileId, userId);
        return ResponseEntity.noContent().build();
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}