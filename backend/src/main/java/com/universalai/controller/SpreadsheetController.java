package com.universalai.controller;

import com.universalai.dto.SpreadsheetDTO;
import com.universalai.entity.Spreadsheet;
import com.universalai.entity.User;
import com.universalai.repository.SpreadsheetRepository;
import com.universalai.repository.UserRepository;
import com.universalai.service.AdvancedMemoryService;
import com.universalai.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/spreadsheets")
@RequiredArgsConstructor
@Slf4j
public class SpreadsheetController {

    private final SpreadsheetRepository spreadsheetRepository;
    private final UserRepository userRepository;
    private final AdvancedMemoryService advancedMemoryService; // ADICIONADO
    private final WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<List<SpreadsheetDTO>> getAll() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(spreadsheetRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream().map(SpreadsheetDTO::fromEntity).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<SpreadsheetDTO> create(@RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow();

        Spreadsheet spreadsheet = Spreadsheet.builder()
                .user(user)
                .name(request.getOrDefault("name", "New Spreadsheet"))
                .data(request.getOrDefault("data", "{}"))
                .build();

        Spreadsheet saved = spreadsheetRepository.save(spreadsheet);
        advancedMemoryService.indexSpreadsheet(saved.getId(), userId);

        log.info("▦ Spreadsheet created: {}", saved.getName());

        // DISPARAR WORKFLOW - SPREADSHEET_CREATED
        if (saved.getName() != null && !saved.getName().trim().isEmpty()) {
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("id", saved.getId().toString());
            eventData.put("name", saved.getName());
            eventData.put("category", "spreadsheet");

            workflowService.triggerWorkflows(userId, "SPREADSHEET_CREATED", eventData);
        }

        return ResponseEntity.ok(SpreadsheetDTO.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SpreadsheetDTO> update(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        Spreadsheet spreadsheet = spreadsheetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spreadsheet not found"));

        if (request.containsKey("name")) spreadsheet.setName(request.get("name"));
        if (request.containsKey("data")) spreadsheet.setData(request.get("data"));

        Spreadsheet updated = spreadsheetRepository.save(spreadsheet);
        UUID userId = getCurrentUserId();
        advancedMemoryService.indexSpreadsheet(updated.getId(), userId);

        // DISPARAR WORKFLOW - SPREADSHEET_UPDATED
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("id", updated.getId().toString());
        eventData.put("name", updated.getName());

        workflowService.triggerWorkflows(userId, "SPREADSHEET_UPDATED", eventData);

        return ResponseEntity.ok(SpreadsheetDTO.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        spreadsheetRepository.deleteById(id);
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