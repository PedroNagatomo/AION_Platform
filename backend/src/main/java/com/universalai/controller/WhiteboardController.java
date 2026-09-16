package com.universalai.controller;

import com.universalai.dto.WhiteboardDTO;
import com.universalai.entity.User;
import com.universalai.entity.Whiteboard;
import com.universalai.repository.UserRepository;
import com.universalai.repository.WhiteboardRepository;
import com.universalai.service.AdvancedMemoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/whiteboards")
@RequiredArgsConstructor
public class WhiteboardController {

    private final WhiteboardRepository whiteboardRepository;
    private final UserRepository userRepository;
    private final AdvancedMemoryService advancedMemoryService; // ADICIONADO

    @GetMapping
    public ResponseEntity<List<WhiteboardDTO>> getAllWhiteboards() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(whiteboardRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream().map(WhiteboardDTO::fromEntity).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<WhiteboardDTO> createWhiteboard(@RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow();

        Whiteboard whiteboard = Whiteboard.builder()
                .user(user)
                .name(request.getOrDefault("name", "New Whiteboard"))
                .data(request.getOrDefault("data", "[]"))
                .icon(request.getOrDefault("icon", "🎨"))
                .build();

        Whiteboard saved = whiteboardRepository.save(whiteboard);

        // INDEXAR
        advancedMemoryService.indexWhiteboard(saved.getId(), userId);

        return ResponseEntity.ok(WhiteboardDTO.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WhiteboardDTO> updateWhiteboard(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        Whiteboard whiteboard = whiteboardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Whiteboard not found"));

        if (request.containsKey("name")) whiteboard.setName(request.get("name"));
        if (request.containsKey("data")) whiteboard.setData(request.get("data"));
        if (request.containsKey("icon")) whiteboard.setIcon(request.get("icon"));

        Whiteboard updated = whiteboardRepository.save(whiteboard);

        // RE-INDEXAR
        advancedMemoryService.indexWhiteboard(updated.getId(), getCurrentUserId());

        return ResponseEntity.ok(WhiteboardDTO.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWhiteboard(@PathVariable UUID id) {
        whiteboardRepository.deleteById(id);
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