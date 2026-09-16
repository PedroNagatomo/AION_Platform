package com.universalai.controller;

import com.universalai.entity.User;
import com.universalai.repository.UserRepository;
import com.universalai.service.AdvancedMemoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/memory")
@RequiredArgsConstructor
public class MemoryController {

    private final AdvancedMemoryService advancedMemoryService;
    private final UserRepository userRepository;

    @PostMapping("/index-all")
    public ResponseEntity<Map<String, String>> indexAll() {
        UUID userId = getCurrentUserId();
        advancedMemoryService.indexAllUserData(userId);
        return ResponseEntity.ok(Map.of("status", "indexing complete"));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchMemories(@RequestParam String q) {
        UUID userId = getCurrentUserId();
        var memories = advancedMemoryService.findRelevantMemories(userId, q, 10);

        return ResponseEntity.ok(memories.stream().map(m -> {
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("id", m.getId());
            result.put("topic", m.getTopic());
            result.put("content", m.getContent());
            result.put("category", m.getCategory());
            result.put("keywords", m.getKeywords());
            result.put("createdAt", m.getCreatedAt());
            return result;
        }).toList());
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}