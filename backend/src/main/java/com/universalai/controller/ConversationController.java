package com.universalai.controller;

import com.universalai.dto.ConversationResponse;
import com.universalai.dto.MessageResponse;
import com.universalai.dto.UpdateMessageRequest;
import com.universalai.entity.User;
import com.universalai.repository.UserRepository;
import com.universalai.service.ConversationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(@RequestParam(required = false) String title) {
        UUID userId = getCurrentUserId();
        var conversation = conversationService.createConversation(userId, title);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ConversationResponse.fromEntity(conversation));
    }

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getUserConversations() {
        UUID userId = getCurrentUserId();
        List<ConversationResponse> conversations = conversationService.getUserConversations(userId)
                .stream()
                .map(ConversationResponse::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(conversations);
    }

    /**
     * Envia mensagem com ou sem arquivos (multipart/form-data)
     * Este é o ÚNICO método para enviar mensagens
     */
    @PostMapping(value = "/{conversationId}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable UUID conversationId,
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestParam(value = "files", required = false) MultipartFile[] files) {

        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(conversationService.sendMessageWithFiles(conversationId, userId, content, files));
    }

    @GetMapping("/{conversationId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(@PathVariable UUID conversationId) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(conversationService.getConversationMessages(conversationId, userId));
    }

    @PutMapping("/{conversationId}/messages/{messageId}")
    public ResponseEntity<MessageResponse> updateMessage(
            @PathVariable UUID conversationId,
            @PathVariable UUID messageId,
            @Valid @RequestBody UpdateMessageRequest request) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(conversationService.updateMessage(conversationId, messageId, userId, request));
    }

    @PostMapping("/{conversationId}/end")
    public ResponseEntity<Void> endConversation(@PathVariable UUID conversationId) {
        UUID userId = getCurrentUserId();
        conversationService.endConversation(conversationId, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{conversationId}/memory")
    public ResponseEntity<Void> clearMemory(@PathVariable UUID conversationId) {
        UUID userId = getCurrentUserId();
        conversationService.clearMemory(userId);
        return ResponseEntity.noContent().build();
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        return user.getId();
    }

    @PutMapping("/{conversationId}/title")
    public ResponseEntity<ConversationResponse> updateConversationTitle(
            @PathVariable UUID conversationId,
            @RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        String newTitle = request.get("title");
        return ResponseEntity.ok(ConversationResponse.fromEntity(
                conversationService.updateConversationTitle(conversationId, userId, newTitle)));
    }

    @DeleteMapping("/{conversationId}")
    public ResponseEntity<Void> deleteConversation(@PathVariable UUID conversationId) {
        UUID userId = getCurrentUserId();
        conversationService.deleteConversation(conversationId, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAllConversations() {
        UUID userId = getCurrentUserId();
        conversationService.deleteAllConversations(userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{conversationId}/pin")
    public ResponseEntity<ConversationResponse> togglePin(@PathVariable UUID conversationId) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(ConversationResponse.fromEntity(
                conversationService.togglePin(conversationId, userId)));
    }
}