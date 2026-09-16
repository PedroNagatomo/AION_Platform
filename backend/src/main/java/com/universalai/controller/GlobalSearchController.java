package com.universalai.controller;

import com.universalai.entity.*;
import com.universalai.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class GlobalSearchController {

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NoteRepository noteRepository;
    private final ContactRepository contactRepository;
    private final ReminderRepository reminderRepository;
    private final UserFileRepository userFileRepository;
    private final SpreadsheetRepository spreadsheetRepository;
    private final ChartRepository chartRepository;
    private final CalendarEventRepository calendarEventRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> globalSearch(@RequestParam String q) {
        UUID userId = getCurrentUserId();
        String searchTerm = q.toLowerCase().trim();

        if (searchTerm.isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>());
        }

        List<Map<String, Object>> results = new ArrayList<>();

        // Buscar em conversas
        conversationRepository.findAllActiveByUserId(userId).stream()
                .filter(c -> c.getTitle() != null && c.getTitle().toLowerCase().contains(searchTerm))
                .limit(5)
                .forEach(c -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", c.getId());
                    result.put("title", c.getTitle());
                    result.put("type", "conversation");
                    result.put("icon", "❯");
                    result.put("subtitle", "Conversation");
                    result.put("path", "/chat/" + c.getId());
                    result.put("updatedAt", c.getUpdatedAt());
                    results.add(result);
                });

        // Buscar em mensagens
        messageRepository.findByConversationUserIdAndContentContainingIgnoreCase(userId, q).stream()
                .limit(5)
                .forEach(m -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", m.getId());
                    result.put("title", truncate(m.getContent(), 80));
                    result.put("type", "message");
                    result.put("icon", "💬");
                    result.put("subtitle", "Message in: " + (m.getConversation().getTitle() != null ? m.getConversation().getTitle() : "Untitled"));
                    result.put("path", "/chat/" + m.getConversation().getId());
                    result.put("updatedAt", m.getCreatedAt());
                    results.add(result);
                });

        // Buscar em notas
        noteRepository.findAllActiveByUserId(userId).stream()
                .filter(n -> n.getTitle() != null && n.getTitle().toLowerCase().contains(searchTerm) ||
                        n.getContent() != null && n.getContent().toLowerCase().contains(searchTerm))
                .limit(5)
                .forEach(n -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", n.getId());
                    result.put("title", n.getTitle());
                    result.put("type", "note");
                    result.put("icon", n.getIcon() != null ? n.getIcon() : "📝");
                    result.put("subtitle", "Note");
                    result.put("path", "/notes");
                    result.put("updatedAt", n.getUpdatedAt());
                    results.add(result);
                });

        // Buscar em contatos
        contactRepository.findByUserIdOrderByNameAsc(userId).stream()
                .filter(c -> c.getName().toLowerCase().contains(searchTerm) ||
                        c.getPhone().contains(searchTerm) ||
                        (c.getEmail() != null && c.getEmail().toLowerCase().contains(searchTerm)))
                .limit(5)
                .forEach(c -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", c.getId());
                    result.put("title", c.getName());
                    result.put("type", "contact");
                    result.put("icon", "👤");
                    result.put("subtitle", c.getPhone());
                    result.put("path", "/contacts");
                    result.put("updatedAt", c.getUpdatedAt());
                    results.add(result);
                });

        // Buscar em lembretes
        reminderRepository.findByUserIdOrderByReminderTimeAsc(userId).stream()
                .filter(r -> r.getTitle().toLowerCase().contains(searchTerm))
                .limit(5)
                .forEach(r -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", r.getId());
                    result.put("title", r.getTitle());
                    result.put("type", "reminder");
                    result.put("icon", "⏰");
                    result.put("subtitle", "Reminder");
                    result.put("path", "/reminders");
                    result.put("updatedAt", r.getCreatedAt());
                    results.add(result);
                });

        // Buscar em arquivos
        userFileRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(f -> f.getFileName().toLowerCase().contains(searchTerm))
                .limit(5)
                .forEach(f -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", f.getId());
                    result.put("title", f.getFileName());
                    result.put("type", "file");
                    result.put("icon", getFileIcon(f.getFileType()));
                    result.put("subtitle", "File");
                    result.put("path", "/files");
                    result.put("updatedAt", f.getCreatedAt());
                    results.add(result);
                });

        // Buscar em planilhas
        spreadsheetRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .filter(s -> s.getName().toLowerCase().contains(searchTerm))
                .limit(5)
                .forEach(s -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", s.getId());
                    result.put("title", s.getName());
                    result.put("type", "spreadsheet");
                    result.put("icon", "▦");
                    result.put("subtitle", "Spreadsheet");
                    result.put("path", "/spreadsheets");
                    result.put("updatedAt", s.getUpdatedAt());
                    results.add(result);
                });

        // Buscar em gráficos
        chartRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .filter(c -> c.getName().toLowerCase().contains(searchTerm))
                .limit(5)
                .forEach(c -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", c.getId());
                    result.put("title", c.getName());
                    result.put("type", "chart");
                    result.put("icon", "📊");
                    result.put("subtitle", "Chart");
                    result.put("path", "/charts");
                    result.put("updatedAt", c.getUpdatedAt());
                    results.add(result);
                });

        // Buscar em eventos do calendário
        calendarEventRepository.findByUserIdOrderByDateAsc(userId).stream()
                .filter(e -> e.getTitle().toLowerCase().contains(searchTerm))
                .limit(5)
                .forEach(e -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", e.getId());
                    result.put("title", e.getTitle());
                    result.put("type", "calendar");
                    result.put("icon", "📅");
                    result.put("subtitle", "Calendar Event");
                    result.put("path", "/calendar");
                    result.put("updatedAt", e.getCreatedAt());
                    results.add(result);
                });

        // Ordenar por data de atualização (mais recente primeiro)
        results.sort((a, b) -> {
            Object dateA = a.get("updatedAt");
            Object dateB = b.get("updatedAt");
            if (dateA == null || dateB == null) return 0;
            return dateB.toString().compareTo(dateA.toString());
        });

        return ResponseEntity.ok(results);
    }

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }

    private String getFileIcon(String fileType) {
        if (fileType == null) return "📁";
        if (fileType.startsWith("image/")) return "🖼️";
        if (fileType.contains("pdf")) return "📕";
        if (fileType.contains("text") || fileType.contains("markdown")) return "📄";
        if (fileType.contains("json")) return "📋";
        if (fileType.contains("zip") || fileType.contains("rar")) return "📦";
        if (fileType.contains("audio")) return "🎵";
        if (fileType.contains("video")) return "🎬";
        return "📁";
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}