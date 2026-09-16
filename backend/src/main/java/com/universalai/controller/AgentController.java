package com.universalai.controller;

import com.universalai.dto.AgentDTO;
import com.universalai.dto.MessageResponse;
import com.universalai.entity.Agent;
import com.universalai.entity.User;
import com.universalai.repository.AgentRepository;
import com.universalai.repository.UserRepository;
import com.universalai.service.AgentService;
import com.universalai.service.ConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agents")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;
    private final UserRepository userRepository;
    private final ConversationService conversationService;
    private final AgentRepository agentRepository;

    @GetMapping
    public ResponseEntity<List<AgentDTO>> getAllAgents() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(agentService.getUserAgents(userId));
    }

    @PostMapping
    public ResponseEntity<AgentDTO> createAgent(@RequestBody AgentDTO dto) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(agentService.createAgent(userId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AgentDTO> updateAgent(@PathVariable UUID id, @RequestBody AgentDTO dto) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(agentService.updateAgent(id, userId, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAgent(@PathVariable UUID id) {
        UUID userId = getCurrentUserId();
        agentService.deleteAgent(id, userId);
        return ResponseEntity.noContent().build();
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    @PostMapping(value = "/{conversationId}/messages", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MessageResponse> sendMessage(
            @PathVariable UUID conversationId,
            @RequestParam(value = "content", required = false, defaultValue = "") String content,
            @RequestParam(value = "files", required = false) MultipartFile[] files,
            @RequestParam(value = "agentId", required = false) UUID agentId) {

        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(conversationService.sendMessageWithFilesAndAgent(
                conversationId, userId, content, files, agentId));
    }

    @PostMapping("/init")
    public ResponseEntity<List<AgentDTO>> initializeAgents() {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verificar se já tem agentes
        List<Agent> existingAgents = agentRepository.findByUserIdOrderByNameAsc(userId);

        if (existingAgents.isEmpty()) {
            agentService.createDefaultAgentsForUser(user);
        }

        return ResponseEntity.ok(agentService.getUserAgents(userId));
    }
}