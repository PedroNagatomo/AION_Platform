package com.universalai.controller;

import com.universalai.dto.ContactDTO;
import com.universalai.entity.Contact;
import com.universalai.entity.User;
import com.universalai.repository.ContactRepository;
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
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
@Slf4j
public class ContactController {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;
    private final AdvancedMemoryService advancedMemoryService;
    private final WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<List<ContactDTO>> getAll() {
        UUID userId = getCurrentUserId();
        List<ContactDTO> contacts = contactRepository.findByUserIdOrderByNameAsc(userId)
                .stream()
                .map(ContactDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(contacts);
    }

    @PostMapping
    public ResponseEntity<ContactDTO> create(@RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow();

        Contact contact = Contact.builder()
                .user(user)
                .name(request.get("name"))
                .phone(request.get("phone"))
                .email(request.get("email"))
                .notes(request.get("notes"))
                .build();

        Contact saved = contactRepository.save(contact);
        advancedMemoryService.indexContact(saved.getId(), userId);

        log.info("👤 Contact created: {}", saved.getName());

        // DISPARAR WORKFLOW - CONTACT_CREATED
        if (saved.getName() != null && !saved.getName().trim().isEmpty()) {
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("id", saved.getId().toString());
            eventData.put("name", saved.getName() != null ? saved.getName() : "");
            eventData.put("phone", saved.getPhone() != null ? saved.getPhone() : "");
            eventData.put("email", saved.getEmail() != null ? saved.getEmail() : "");
            eventData.put("notes", saved.getNotes() != null ? saved.getNotes() : "");
            eventData.put("category", "contact");

            log.info("📤 Triggering CONTACT_CREATED with: {}", eventData);
            workflowService.triggerWorkflows(userId, "CONTACT_CREATED", eventData);
        }

        return ResponseEntity.ok(ContactDTO.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactDTO> update(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contato não encontrado"));

        if (request.containsKey("name")) contact.setName(request.get("name"));
        if (request.containsKey("phone")) contact.setPhone(request.get("phone"));
        if (request.containsKey("email")) contact.setEmail(request.get("email"));
        if (request.containsKey("notes")) contact.setNotes(request.get("notes"));

        Contact updated = contactRepository.save(contact);
        advancedMemoryService.indexContact(updated.getId(), userId);

        log.info("👤 Contact updated: {}", updated.getName());

        // DISPARAR WORKFLOW - CONTACT_UPDATED
        Map<String, Object> eventData = new HashMap<>();
        eventData.put("id", updated.getId().toString());
        eventData.put("name", updated.getName() != null ? updated.getName() : "");
        eventData.put("phone", updated.getPhone() != null ? updated.getPhone() : "");
        eventData.put("email", updated.getEmail() != null ? updated.getEmail() : "");
        eventData.put("notes", updated.getNotes() != null ? updated.getNotes() : "");

        log.info("📤 Triggering CONTACT_UPDATED with: {}", eventData);
        workflowService.triggerWorkflows(userId, "CONTACT_UPDATED", eventData);

        return ResponseEntity.ok(ContactDTO.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        contactRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return user.getId();
    }
}