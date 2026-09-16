package com.universalai.controller;

import com.universalai.dto.WorkflowDTO;
import com.universalai.entity.User;
import com.universalai.repository.UserRepository;
import com.universalai.service.AIWorkflowGeneratorService;
import com.universalai.service.WorkflowAnalyticsService;
import com.universalai.service.WorkflowService;
import com.universalai.service.WorkflowTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/workflows")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;
    private final UserRepository userRepository;
    private final AIWorkflowGeneratorService aiGenerator;
    private final WorkflowTemplateService templateService;
    private final WorkflowAnalyticsService analyticsService;



    @GetMapping
    public ResponseEntity<List<WorkflowDTO>> getAllWorkflows() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(workflowService.getUserWorkflows(userId));
    }

    @PostMapping
    public ResponseEntity<WorkflowDTO> createWorkflow(@RequestBody WorkflowDTO dto) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(workflowService.createWorkflow(userId, dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkflowDTO> updateWorkflow(@PathVariable UUID id, @RequestBody WorkflowDTO dto) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(workflowService.updateWorkflow(id, userId, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkflow(@PathVariable UUID id) {
        UUID userId = getCurrentUserId();
        workflowService.deleteWorkflow(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<WorkflowDTO> toggleWorkflow(@PathVariable UUID id) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(workflowService.toggleWorkflow(id, userId));
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<Map<String, Object>> testWorkflow(@PathVariable UUID id) {
        UUID userId = getCurrentUserId();

        Map<String, Object> testData = new HashMap<>();
        testData.put("test", true);
        testData.put("timestamp", System.currentTimeMillis());

        workflowService.triggerWorkflows(userId, "MANUAL", testData);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "Workflow test triggered");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/executions")
    public ResponseEntity<List<Map<String, Object>>> getExecutions(
            @RequestParam(defaultValue = "20") int limit) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(workflowService.getExecutions(userId, limit));
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    @PostMapping("/ai-generate")
    public ResponseEntity<WorkflowDTO> aiGenerate(@RequestBody Map<String, String> request) {
        String description = request.get("description");
        String language = request.getOrDefault("language", "en-US");

        if (description == null || description.trim().isEmpty()) {
            throw new RuntimeException("Description is required");
        }

        WorkflowDTO generated = aiGenerator.generateWorkflow(description, language);
        return ResponseEntity.ok(generated);
    }

    @PostMapping("/ai-generate-and-save")
    public ResponseEntity<WorkflowDTO> aiGenerateAndSave(@RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        String description = request.get("description");
        String language = request.getOrDefault("language", "en-US");

        WorkflowDTO generated = aiGenerator.generateWorkflow(description, language);
        WorkflowDTO saved = workflowService.createWorkflow(userId, generated);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/templates")
    public ResponseEntity<List<WorkflowDTO>> getTemplates(@RequestParam(defaultValue = "en-US") String language) {
        return ResponseEntity.ok(templateService.getTemplates(language));
    }

    @PostMapping("/templates/{index}/use")
    public ResponseEntity<WorkflowDTO> useTemplate(@PathVariable int index, @RequestParam(defaultValue = "en-US") String language) {
        UUID userId = getCurrentUserId();
        List<WorkflowDTO> templates = templateService.getTemplates(language);

        if (index < 0 || index >= templates.size()) {
            throw new RuntimeException("Template not found");
        }

        WorkflowDTO template = templates.get(index);
        return ResponseEntity.ok(workflowService.createWorkflow(userId, template));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(analyticsService.getAnalytics(userId));
    }
}