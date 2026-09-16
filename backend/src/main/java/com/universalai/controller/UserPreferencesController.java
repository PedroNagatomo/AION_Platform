package com.universalai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.universalai.dto.UserPreferencesDTO;
import com.universalai.entity.User;
import com.universalai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/preferences")
@RequiredArgsConstructor
public class UserPreferencesController {

    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getPreferences() {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow();

        Map<String, Object> prefs = new HashMap<>();

        try {
            if (user.getPreferences() != null) {
                prefs = objectMapper.readValue(user.getPreferences(), Map.class);
            }
        } catch (Exception e) {
            // Ignorar
        }

        // Garantir que jarvisEnabled existe
        if (!prefs.containsKey("jarvisEnabled")) {
            prefs.put("jarvisEnabled", false);
        }

        return ResponseEntity.ok(prefs);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updatePreferences(@RequestBody Map<String, Object> preferences) {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow();

        try {
            String json = objectMapper.writeValueAsString(preferences);
            user.setPreferences(json);
            userRepository.save(user);
        } catch (Exception e) {
            throw new RuntimeException("Error saving preferences: " + e.getMessage());
        }

        return ResponseEntity.ok(preferences);
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return user.getId();
    }
}