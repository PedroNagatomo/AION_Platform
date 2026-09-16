package com.universalai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.universalai.entity.User;
import com.universalai.repository.UserRepository;
import com.universalai.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    /**
     * Exporta conversa como Markdown
     */
    @GetMapping("/conversation/{conversationId}/markdown")
    public ResponseEntity<byte[]> exportConversationMarkdown(@PathVariable UUID conversationId) {
        UUID userId = getCurrentUserId();
        String markdown = exportService.exportConversationAsMarkdown(conversationId, userId);

        return createTextResponse(markdown, "conversation_" + conversationId + ".md", "text/markdown");
    }

    /**
     * Exporta conversa como TXT
     */
    @GetMapping("/conversation/{conversationId}/txt")
    public ResponseEntity<byte[]> exportConversationTxt(@PathVariable UUID conversationId) {
        UUID userId = getCurrentUserId();
        String txt = exportService.exportConversationAsTxt(conversationId, userId);

        return createTextResponse(txt, "conversation_" + conversationId + ".txt", "text/plain");
    }

    /**
     * Exporta nota como Markdown
     */
    @GetMapping("/note/{noteId}/markdown")
    public ResponseEntity<byte[]> exportNoteMarkdown(@PathVariable UUID noteId) {
        UUID userId = getCurrentUserId();
        String markdown = exportService.exportNoteAsMarkdown(noteId, userId);

        return createTextResponse(markdown, "note_" + noteId + ".md", "text/markdown");
    }

    /**
     * Exporta nota como TXT
     */
    @GetMapping("/note/{noteId}/txt")
    public ResponseEntity<byte[]> exportNoteTxt(@PathVariable UUID noteId) {
        UUID userId = getCurrentUserId();
        String txt = exportService.exportNoteAsTxt(noteId, userId);

        return createTextResponse(txt, "note_" + noteId + ".txt", "text/plain");
    }

    /**
     * Exporta backup completo em JSON
     */
    @GetMapping("/backup")
    public ResponseEntity<byte[]> exportBackup() {
        UUID userId = getCurrentUserId();
        Map<String, Object> backup = exportService.exportFullBackup(userId);

        try {
            String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(backup);
            return createTextResponse(json, "backup_" + System.currentTimeMillis() + ".json", "application/json");
        } catch (Exception e) {
            throw new RuntimeException("Error creating backup: " + e.getMessage());
        }
    }

    private ResponseEntity<byte[]> createTextResponse(String content, String filename, String contentType) {
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        headers.setContentLength(bytes.length);

        return ResponseEntity.ok().headers(headers).body(bytes);
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}