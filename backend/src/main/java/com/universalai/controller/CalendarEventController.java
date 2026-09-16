package com.universalai.controller;

import com.universalai.dto.CalendarEventDTO;
import com.universalai.entity.CalendarEvent;
import com.universalai.entity.User;
import com.universalai.repository.CalendarEventRepository;
import com.universalai.repository.UserRepository;
import com.universalai.service.AdvancedMemoryService;
import com.universalai.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/calendar")
@RequiredArgsConstructor
@Slf4j
public class CalendarEventController {

    private final CalendarEventRepository eventRepository;
    private final UserRepository userRepository;
    private final AdvancedMemoryService advancedMemoryService;
    private final WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<List<CalendarEventDTO>> getAll() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(eventRepository.findByUserIdOrderByDateAsc(userId)
                .stream().map(CalendarEventDTO::fromEntity).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<CalendarEventDTO> create(@RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow();

        CalendarEvent event = CalendarEvent.builder()
                .user(user)
                .title(request.get("title"))
                .date(LocalDate.parse(request.get("date")))
                .time(request.get("time") != null ? LocalTime.parse(request.get("time")) : null)
                .description(request.get("description"))
                .build();

        CalendarEvent saved = eventRepository.save(event);
        advancedMemoryService.indexCalendarEvent(saved.getId(), userId);

        log.info("📅 Event created: {}", saved.getTitle());

        // DISPARAR WORKFLOW - EVENT_CREATED
        if (saved.getTitle() != null && !saved.getTitle().trim().isEmpty()) {
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("id", saved.getId().toString());
            eventData.put("title", saved.getTitle() != null ? saved.getTitle() : "");
            eventData.put("date", saved.getDate() != null ? saved.getDate().toString() : "");
            eventData.put("time", saved.getTime() != null ? saved.getTime().toString() : "");
            eventData.put("description", saved.getDescription() != null ? saved.getDescription() : "");
            eventData.put("category", "calendar");

            log.info("📤 Triggering EVENT_CREATED with: {}", eventData);
            workflowService.triggerWorkflows(userId, "EVENT_CREATED", eventData);
        }

        return ResponseEntity.ok(CalendarEventDTO.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CalendarEventDTO> update(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        CalendarEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (request.containsKey("title")) event.setTitle(request.get("title"));
        if (request.containsKey("date")) event.setDate(LocalDate.parse(request.get("date")));
        if (request.containsKey("time") && request.get("time") != null) {
            event.setTime(LocalTime.parse(request.get("time")));
        }
        if (request.containsKey("description")) event.setDescription(request.get("description"));

        CalendarEvent updated = eventRepository.save(event);
        advancedMemoryService.indexCalendarEvent(updated.getId(), userId);

        Map<String, Object> eventData = new HashMap<>();
        eventData.put("id", updated.getId().toString());
        eventData.put("title", updated.getTitle() != null ? updated.getTitle() : "");
        eventData.put("date", updated.getDate() != null ? updated.getDate().toString() : "");
        eventData.put("time", updated.getTime() != null ? updated.getTime().toString() : "");
        eventData.put("description", updated.getDescription() != null ? updated.getDescription() : "");

        workflowService.triggerWorkflows(userId, "EVENT_UPDATED", eventData);

        return ResponseEntity.ok(CalendarEventDTO.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        eventRepository.deleteById(id);
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