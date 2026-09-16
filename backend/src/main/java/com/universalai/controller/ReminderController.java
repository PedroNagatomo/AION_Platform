package com.universalai.controller;

import com.universalai.dto.ReminderDTO;
import com.universalai.entity.User;
import com.universalai.repository.UserRepository;
import com.universalai.service.AdvancedMemoryService;
import com.universalai.service.ReminderService;
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

@RestController
@RequestMapping("/api/reminders")
@RequiredArgsConstructor
@Slf4j
public class ReminderController {

    private final ReminderService reminderService;
    private final UserRepository userRepository;
    private final AdvancedMemoryService advancedMemoryService;
    private final WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<List<ReminderDTO>> getAllReminders() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(reminderService.getUserReminders(userId));
    }

    @GetMapping("/active")
    public ResponseEntity<List<ReminderDTO>> getActiveReminders() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(reminderService.getActiveReminders(userId));
    }

    @GetMapping("/due")
    public ResponseEntity<List<ReminderDTO>> getDueReminders() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(reminderService.getDueReminders(userId));
    }

    @PostMapping
    public ResponseEntity<ReminderDTO> createReminder(@RequestBody ReminderDTO dto) {
        UUID userId = getCurrentUserId();
        ReminderDTO created = reminderService.createReminder(userId, dto);
        advancedMemoryService.indexReminder(created.getId(), userId);

        log.info("⏰ Reminder created: {}", created.getTitle());

        // DISPARAR WORKFLOW - REMINDER_CREATED
        if (created.getTitle() != null && !created.getTitle().trim().isEmpty()) {
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("id", created.getId().toString());
            eventData.put("title", created.getTitle() != null ? created.getTitle() : "");
            eventData.put("description", created.getDescription() != null ? created.getDescription() : "");
            eventData.put("reminderTime", created.getReminderTime() != null ? created.getReminderTime().toString() : "");
            eventData.put("category", "reminder");

            log.info("📤 Triggering REMINDER_CREATED with: {}", eventData);
            workflowService.triggerWorkflows(userId, "REMINDER_CREATED", eventData);
        }

        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReminderDTO> updateReminder(@PathVariable UUID id, @RequestBody ReminderDTO dto) {
        UUID userId = getCurrentUserId();
        ReminderDTO updated = reminderService.updateReminder(id, userId, dto);
        advancedMemoryService.indexReminder(updated.getId(), userId);

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("id", updated.getId().toString());
        eventData.put("title", updated.getTitle() != null ? updated.getTitle() : "");
        eventData.put("description", updated.getDescription() != null ? updated.getDescription() : "");
        eventData.put("reminderTime", updated.getReminderTime() != null ? updated.getReminderTime().toString() : "");

        workflowService.triggerWorkflows(userId, "REMINDER_UPDATED", eventData);

        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<Void> completeReminder(@PathVariable UUID id) {
        UUID userId = getCurrentUserId();
        reminderService.completeReminder(id, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReminder(@PathVariable UUID id) {
        UUID userId = getCurrentUserId();
        reminderService.deleteReminder(id, userId);
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