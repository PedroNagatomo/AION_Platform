package com.universalai.controller;

import com.universalai.dto.NoteDTO;
import com.universalai.entity.Note;
import com.universalai.entity.User;
import com.universalai.repository.NoteRepository;
import com.universalai.repository.UserRepository;
import com.universalai.service.AdvancedMemoryService;
import com.universalai.service.WorkflowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // ADICIONAR
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
@RequestMapping("/api/notes")
@RequiredArgsConstructor
@Slf4j // ADICIONAR
public class NoteController {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final AdvancedMemoryService advancedMemoryService;
    private final WorkflowService workflowService;

    @GetMapping
    public ResponseEntity<List<NoteDTO>> getAllNotes() {
        UUID userId = getCurrentUserId();
        List<NoteDTO> notes = noteRepository.findAllActiveByUserId(userId)
                .stream()
                .map(NoteDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(notes);
    }

    @PostMapping
    public ResponseEntity<NoteDTO> createNote(@RequestBody Map<String, Object> request) {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow();

        Note note = Note.builder()
                .user(user)
                .title((String) request.getOrDefault("title", "New Note"))
                .content((String) request.getOrDefault("content", ""))
                .parentId(request.get("parentId") != null ? UUID.fromString((String) request.get("parentId")) : null)
                .isFolder((Boolean) request.getOrDefault("isFolder", false))
                .tags((String) request.getOrDefault("tags", ""))
                .icon((String) request.getOrDefault("icon", "📄"))
                .build();

        Note saved = noteRepository.save(note);

        log.info("📝 Note created: id={}, title='{}', content='{}'",
                saved.getId(), saved.getTitle(), saved.getContent());

        // INDEXAR NA MEMÓRIA + DISPARAR WORKFLOWS
        if (!Boolean.TRUE.equals(saved.getIsFolder())) {
            advancedMemoryService.indexNote(saved.getId(), userId);

            // Só disparar workflow se a nota tem conteúdo
            String strippedContent = stripHtml(saved.getContent());

            log.info("📤 Workflow trigger check: content='{}', isEmpty={}",
                    strippedContent, strippedContent.isEmpty());

            if (!strippedContent.isEmpty()) {
                Map<String, Object> eventData = new HashMap<>();
                eventData.put("id", saved.getId().toString());
                eventData.put("title", saved.getTitle() != null ? saved.getTitle() : "");
                eventData.put("content", strippedContent);
                eventData.put("tags", saved.getTags() != null ? saved.getTags() : "");
                eventData.put("icon", saved.getIcon() != null ? saved.getIcon() : "");
                eventData.put("category", "note");

                log.info("📤 Triggering NOTE_CREATED workflows with: {}", eventData);
                workflowService.triggerWorkflows(userId, "NOTE_CREATED", eventData);
            } else {
                log.info("⏭️ Skipping workflow trigger - note has no content yet");
            }
        }

        return ResponseEntity.ok(NoteDTO.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<NoteDTO> updateNote(@PathVariable UUID id, @RequestBody Map<String, Object> request) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        String previousContent = stripHtml(note.getContent());

        if (request.containsKey("title")) note.setTitle((String) request.get("title"));
        if (request.containsKey("content")) note.setContent((String) request.get("content"));
        if (request.containsKey("parentId")) {
            note.setParentId(request.get("parentId") != null ? UUID.fromString((String) request.get("parentId")) : null);
        }
        if (request.containsKey("isFolder")) note.setIsFolder((Boolean) request.get("isFolder"));
        if (request.containsKey("tags")) note.setTags((String) request.get("tags"));
        if (request.containsKey("icon")) note.setIcon((String) request.get("icon"));

        Note updated = noteRepository.save(note);
        UUID userId = getCurrentUserId();

        log.info("📝 Note updated: id={}, title='{}', content='{}'",
                updated.getId(), updated.getTitle(), stripHtml(updated.getContent()));

        if (!Boolean.TRUE.equals(updated.getIsFolder())) {
            advancedMemoryService.indexNote(updated.getId(), userId);

            String newContent = stripHtml(updated.getContent());

            // Se a nota ANTES estava vazia e AGORA tem conteúdo, disparar NOTE_CREATED
            boolean wasEmpty = previousContent.isEmpty();
            boolean nowHasContent = !newContent.isEmpty();

            log.info("📤 Update check: wasEmpty={}, nowHasContent={}", wasEmpty, nowHasContent);

            if (wasEmpty && nowHasContent) {
                // Nota estava vazia, agora tem conteúdo → disparar NOTE_CREATED
                Map<String, Object> eventData = new HashMap<>();
                eventData.put("id", updated.getId().toString());
                eventData.put("title", updated.getTitle() != null ? updated.getTitle() : "");
                eventData.put("content", newContent);
                eventData.put("tags", updated.getTags() != null ? updated.getTags() : "");
                eventData.put("icon", updated.getIcon() != null ? updated.getIcon() : "");
                eventData.put("category", "note");

                log.info("📤 Triggering NOTE_CREATED (was empty before): {}", eventData);
                workflowService.triggerWorkflows(userId, "NOTE_CREATED", eventData);
            }

            // Sempre disparar NOTE_UPDATED
            Map<String, Object> eventData = new HashMap<>();
            eventData.put("id", updated.getId().toString());
            eventData.put("title", updated.getTitle() != null ? updated.getTitle() : "");
            eventData.put("content", newContent);
            eventData.put("tags", updated.getTags() != null ? updated.getTags() : "");
            eventData.put("icon", updated.getIcon() != null ? updated.getIcon() : "");

            log.info("📤 Triggering NOTE_UPDATED: {}", eventData);
            workflowService.triggerWorkflows(userId, "NOTE_UPDATED", eventData);
        }

        return ResponseEntity.ok(NoteDTO.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable UUID id) {
        UUID userId = getCurrentUserId();
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota não encontrada"));

        if (!note.getUser().getId().equals(userId)) {
            throw new RuntimeException("Acesso negado");
        }

        noteRepository.delete(note);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/rename")
    public ResponseEntity<NoteDTO> renameNote(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Nota não encontrada"));

        if (!note.getUser().getId().equals(userId)) {
            throw new RuntimeException("Acesso negado");
        }

        String newTitle = request.get("title");
        if (newTitle != null && !newTitle.trim().isEmpty()) {
            note.setTitle(newTitle.trim());
            noteRepository.save(note);
        }

        return ResponseEntity.ok(NoteDTO.fromEntity(note));
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]+>", " ")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&amp;", "&")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return user.getId();
    }
}