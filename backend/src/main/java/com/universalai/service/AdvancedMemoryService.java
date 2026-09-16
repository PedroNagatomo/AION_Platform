package com.universalai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.universalai.entity.*;
import com.universalai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdvancedMemoryService {

    private final MemoryEntryRepository memoryEntryRepository;
    private final UserRepository userRepository;
    private final NoteRepository noteRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ContactRepository contactRepository;
    private final ReminderRepository reminderRepository;
    private final SpreadsheetRepository spreadsheetRepository;
    private final ChartRepository chartRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final UserFileRepository userFileRepository;
    private final WhiteboardRepository whiteboardRepository;
    private final ObjectMapper objectMapper;

    // ============ INDEXAÇÃO ============

    @Transactional
    public void indexNote(UUID noteId, UUID userId) {
        try {
            Note note = noteRepository.findById(noteId).orElse(null);
            if (note == null || !note.getUser().getId().equals(userId)) return;

            String plainContent = stripHtml(note.getContent());
            String fullText = "NOTE: " + note.getTitle() + "\n" + plainContent;

            saveMemory(userId, "note", note.getTitle(), fullText, note.getId(), 3);
            log.info("📝 Indexed NOTE: {}", note.getTitle());
        } catch (Exception e) {
            log.error("Error indexing note: {}", e.getMessage());
        }
    }

    @Transactional
    public void indexConversation(UUID conversationId, UUID userId) {
        try {
            Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
            if (conversation == null || !conversation.getUser().getId().equals(userId)) return;

            List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
            if (messages.size() < 2) return;

            String topic = conversation.getTitle() != null ? conversation.getTitle() : messages.get(0).getContent();
            String content = messages.stream()
                    .map(m -> m.getRole() + ": " + m.getContent())
                    .collect(Collectors.joining("\n"));

            saveMemory(userId, "conversation", topic, "CONVERSATION: " + topic + "\n" + truncate(content, 1500), conversation.getId(), 3);
            log.info("💬 Indexed CONVERSATION: {}", topic);
        } catch (Exception e) {
            log.error("Error indexing conversation: {}", e.getMessage());
        }
    }

    @Transactional
    public void indexContact(UUID contactId, UUID userId) {
        try {
            Contact contact = contactRepository.findById(contactId).orElse(null);
            if (contact == null || !contact.getUser().getId().equals(userId)) return;

            StringBuilder content = new StringBuilder();
            content.append("CONTACT: ").append(contact.getName());
            content.append("\nPhone: ").append(contact.getPhone());
            if (contact.getEmail() != null && !contact.getEmail().isEmpty())
                content.append("\nEmail: ").append(contact.getEmail());
            if (contact.getNotes() != null && !contact.getNotes().isEmpty())
                content.append("\nNotes: ").append(contact.getNotes());

            saveMemory(userId, "contact", contact.getName(), content.toString(), contact.getId(), 3);
            log.info("👤 Indexed CONTACT: {}", contact.getName());
        } catch (Exception e) {
            log.error("Error indexing contact: {}", e.getMessage());
        }
    }

    @Transactional
    public void indexReminder(UUID reminderId, UUID userId) {
        try {
            Reminder reminder = reminderRepository.findById(reminderId).orElse(null);
            if (reminder == null || !reminder.getUser().getId().equals(userId)) return;

            StringBuilder content = new StringBuilder();
            content.append("REMINDER: ").append(reminder.getTitle());
            if (reminder.getDescription() != null && !reminder.getDescription().isEmpty())
                content.append("\nDescription: ").append(reminder.getDescription());
            content.append("\nScheduled for: ").append(reminder.getReminderTime());
            content.append("\nStatus: ").append(Boolean.TRUE.equals(reminder.getIsCompleted()) ? "Completed" : "Pending");

            saveMemory(userId, "reminder", reminder.getTitle(), content.toString(), reminder.getId(), 3);
            log.info("⏰ Indexed REMINDER: {}", reminder.getTitle());
        } catch (Exception e) {
            log.error("Error indexing reminder: {}", e.getMessage());
        }
    }

    @Transactional
    public void indexSpreadsheet(UUID spreadsheetId, UUID userId) {
        try {
            Spreadsheet spreadsheet = spreadsheetRepository.findById(spreadsheetId).orElse(null);
            if (spreadsheet == null || !spreadsheet.getUser().getId().equals(userId)) return;

            StringBuilder content = new StringBuilder();
            content.append("SPREADSHEET: ").append(spreadsheet.getName());

            try {
                if (spreadsheet.getData() != null && !spreadsheet.getData().isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> data = objectMapper.readValue(spreadsheet.getData(), Map.class);

                    @SuppressWarnings("unchecked")
                    List<String> columns = (List<String>) data.get("columns");
                    if (columns != null && !columns.isEmpty()) {
                        content.append("\nColumns: ").append(String.join(", ", columns));
                    }

                    @SuppressWarnings("unchecked")
                    List<List<Map<String, String>>> rows = (List<List<Map<String, String>>>) data.get("rows");
                    if (rows != null && !rows.isEmpty()) {
                        content.append("\nTotal rows: ").append(rows.size());
                        content.append("\nData:");

                        int rowsWithContent = 0;
                        for (List<Map<String, String>> row : rows) {
                            StringBuilder rowText = new StringBuilder();
                            for (Map<String, String> cell : row) {
                                String value = cell.get("value");
                                if (value != null && !value.trim().isEmpty()) {
                                    rowText.append(value).append(" | ");
                                }
                            }
                            if (rowText.length() > 0) {
                                content.append("\n  ").append(rowText.toString().trim());
                                rowsWithContent++;
                                if (rowsWithContent >= 20) break;
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Error parsing spreadsheet data: {}", e.getMessage());
            }

            saveMemory(userId, "spreadsheet", spreadsheet.getName(), content.toString(), spreadsheet.getId(), 3);
            log.info("▦ Indexed SPREADSHEET: {}", spreadsheet.getName());
        } catch (Exception e) {
            log.error("Error indexing spreadsheet: {}", e.getMessage());
        }
    }

    @Transactional
    public void indexChart(UUID chartId, UUID userId) {
        try {
            Chart chart = chartRepository.findById(chartId).orElse(null);
            if (chart == null || !chart.getUser().getId().equals(userId)) return;

            StringBuilder content = new StringBuilder();
            content.append("CHART: ").append(chart.getName());
            content.append("\nType: ").append(chart.getChartType());

            try {
                if (chart.getData() != null && !chart.getData().isEmpty()) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> data = objectMapper.readValue(chart.getData(), List.class);
                    if (!data.isEmpty()) {
                        content.append("\nData points: ").append(data.size());
                    }
                }
            } catch (Exception e) {
                log.warn("Error parsing chart data: {}", e.getMessage());
            }

            saveMemory(userId, "chart", chart.getName(), content.toString(), chart.getId(), 3);
            log.info("📊 Indexed CHART: {}", chart.getName());
        } catch (Exception e) {
            log.error("Error indexing chart: {}", e.getMessage());
        }
    }

    @Transactional
    public void indexCalendarEvent(UUID eventId, UUID userId) {
        try {
            CalendarEvent event = calendarEventRepository.findById(eventId).orElse(null);
            if (event == null || !event.getUser().getId().equals(userId)) return;

            StringBuilder content = new StringBuilder();
            content.append("CALENDAR EVENT: ").append(event.getTitle());
            content.append("\nDate: ").append(event.getDate());
            if (event.getTime() != null)
                content.append("\nTime: ").append(event.getTime());
            if (event.getDescription() != null && !event.getDescription().isEmpty())
                content.append("\nDescription: ").append(event.getDescription());

            saveMemory(userId, "calendar", event.getTitle(), content.toString(), event.getId(), 3);
            log.info("📅 Indexed CALENDAR EVENT: {}", event.getTitle());
        } catch (Exception e) {
            log.error("Error indexing calendar event: {}", e.getMessage());
        }
    }

    @Transactional
    public void indexFile(UUID fileId, UUID userId) {
        try {
            UserFile file = userFileRepository.findById(fileId).orElse(null);
            if (file == null || !file.getUser().getId().equals(userId)) return;

            StringBuilder content = new StringBuilder();
            content.append("FILE: ").append(file.getFileName());
            content.append("\nType: ").append(file.getFileType());
            content.append("\nSize: ").append(formatFileSize(file.getFileSize()));
            if (file.getFolderName() != null && !file.getFolderName().isEmpty())
                content.append("\nFolder: ").append(file.getFolderName());

            saveMemory(userId, "file", file.getFileName(), content.toString(), file.getId(), 2);
            log.info("📁 Indexed FILE: {}", file.getFileName());
        } catch (Exception e) {
            log.error("Error indexing file: {}", e.getMessage());
        }
    }

    @Transactional
    public void indexWhiteboard(UUID whiteboardId, UUID userId) {
        try {
            Whiteboard whiteboard = whiteboardRepository.findById(whiteboardId).orElse(null);
            if (whiteboard == null || !whiteboard.getUser().getId().equals(userId)) return;

            StringBuilder content = new StringBuilder();
            content.append("WHITEBOARD: ").append(whiteboard.getName());

            try {
                if (whiteboard.getData() != null && !whiteboard.getData().isEmpty()) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> elements = objectMapper.readValue(whiteboard.getData(), List.class);
                    content.append("\nElements: ").append(elements.size());

                    List<String> texts = new ArrayList<>();
                    for (Map<String, Object> el : elements) {
                        if ("text".equals(el.get("type")) && el.get("text") != null) {
                            texts.add((String) el.get("text"));
                        }
                    }
                    if (!texts.isEmpty()) {
                        content.append("\nText content: ").append(String.join(" | ", texts));
                    }
                }
            } catch (Exception e) {
                log.warn("Error parsing whiteboard data: {}", e.getMessage());
            }

            saveMemory(userId, "whiteboard", whiteboard.getName(), content.toString(), whiteboard.getId(), 2);
            log.info("🎨 Indexed WHITEBOARD: {}", whiteboard.getName());
        } catch (Exception e) {
            log.error("Error indexing whiteboard: {}", e.getMessage());
        }
    }

    // ============ BUSCA ============

    @Transactional(readOnly = true)
    public List<MemoryEntry> findRelevantMemories(UUID userId, String query, int limit) {
        String cleanQuery = normalizeText(query);
        String[] queryWords = cleanQuery.split("\\s+");
        Set<String> stopWords = getStopWords();

        List<String> meaningfulWords = Arrays.stream(queryWords)
                .filter(w -> w.length() > 2)
                .filter(w -> !stopWords.contains(w))
                .collect(Collectors.toList());

        Set<String> intentWords = new HashSet<>();
        String[] categoryKeywords = {"contato", "contact", "lembrete", "reminder", "planilha", "spreadsheet",
                "grafico", "chart", "evento", "event", "calendar", "calendario", "arquivo", "file",
                "whiteboard", "nota", "note", "conversa", "conversation"};

        for (String word : meaningfulWords) {
            for (String catKw : categoryKeywords) {
                if (word.contains(catKw) || catKw.contains(word)) {
                    intentWords.add(catKw);
                }
            }
        }

        List<MemoryEntry> allMemories = memoryEntryRepository.findByUserIdOrderByCreatedAtDesc(userId);

        List<MemoryEntry> relevant = new ArrayList<>();
        Map<MemoryEntry, Integer> scores = new HashMap<>();

        for (MemoryEntry memory : allMemories) {
            int score = calculateRelevanceScore(memory, meaningfulWords, intentWords);
            if (score > 0) {
                scores.put(memory, score);
                relevant.add(memory);
            }
        }

        relevant.sort((a, b) -> scores.getOrDefault(b, 0) - scores.getOrDefault(a, 0));

        log.info("🎯 Found {} relevant memories (from {} total)", relevant.size(), allMemories.size());
        return relevant.stream().limit(limit).collect(Collectors.toList());
    }

    private int calculateRelevanceScore(MemoryEntry memory, List<String> words, Set<String> intentWords) {
        String text = normalizeText(memory.getTopic() + " " + memory.getContent() + " " +
                (memory.getKeywords() != null ? memory.getKeywords() : ""));

        int score = 0;

        for (String word : words) {
            if (text.contains(word)) {
                score += 10;
            }
        }

        String topicNormalized = normalizeText(memory.getTopic());
        for (String word : words) {
            if (topicNormalized.contains(word)) {
                score += 20;
            }
        }

        Map<String, String[]> categoryMapping = Map.of(
                "contact", new String[]{"contato", "contact"},
                "reminder", new String[]{"lembrete", "reminder"},
                "spreadsheet", new String[]{"planilha", "spreadsheet"},
                "chart", new String[]{"grafico", "chart"},
                "calendar", new String[]{"evento", "event", "calendar", "calendario"},
                "file", new String[]{"arquivo", "file"},
                "whiteboard", new String[]{"whiteboard"},
                "note", new String[]{"nota", "note"},
                "conversation", new String[]{"conversa", "conversation"}
        );

        for (String intent : intentWords) {
            for (Map.Entry<String, String[]> entry : categoryMapping.entrySet()) {
                for (String kw : entry.getValue()) {
                    if (intent.contains(kw) || kw.contains(intent)) {
                        if (memory.getCategory().equals(entry.getKey())) {
                            score += 50;
                        }
                    }
                }
            }
        }

        score += (memory.getImportance() != null ? memory.getImportance() : 1) * 2;

        return score;
    }

    // ============ HELPERS ============

    /**
     * CORRIGIDO: Não busca todas as memórias do usuário (evita deadlock)
     * Usa query específica por sourceId
     */
    private void saveMemory(UUID userId, String category, String topic, String content, UUID sourceId, int importance) {
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) return;

            // Deletar apenas memórias com mesmo sourceId (query específica, evita lock em "users")
            if (sourceId != null) {
                List<MemoryEntry> existing = memoryEntryRepository.findBySourceId(sourceId);
                if (!existing.isEmpty()) {
                    memoryEntryRepository.deleteAll(existing);
                }
            }

            MemoryEntry entry = MemoryEntry.builder()
                    .user(user)
                    .category(category)
                    .topic(topic != null ? topic : "Untitled")
                    .content(truncate(content, 2000))
                    .keywords(extractKeywords(topic + " " + content))
                    .sourceType(category)
                    .sourceId(sourceId)
                    .importance(importance)
                    .build();

            memoryEntryRepository.save(entry);
        } catch (Exception e) {
            log.error("Error saving memory: {}", e.getMessage());
        }
    }

    private String extractKeywords(String text) {
        if (text == null || text.isEmpty()) return "";
        String normalized = normalizeText(text);
        return Arrays.stream(normalized.split("\\s+"))
                .filter(w -> w.length() > 4)
                .distinct()
                .limit(20)
                .collect(Collectors.joining(", "));
    }

    private String normalizeText(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replaceAll("<[^>]+>", " ")
                .replaceAll("[?!.,;:()\\[\\]{}]", " ")
                .replaceAll("[áàâãä]", "a")
                .replaceAll("[éèêë]", "e")
                .replaceAll("[íìîï]", "i")
                .replaceAll("[óòôõö]", "o")
                .replaceAll("[úùûü]", "u")
                .replaceAll("ç", "c")
                .replaceAll("\\s+", " ")
                .trim();
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

    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength) + "...";
    }

    private String formatFileSize(long size) {
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.1f KB", size / 1024.0);
        return String.format("%.1f MB", size / (1024.0 * 1024.0));
    }

    private Set<String> getStopWords() {
        return new HashSet<>(Arrays.asList(
                "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
                "of", "with", "is", "are", "was", "were", "be", "been", "being",
                "have", "has", "had", "do", "does", "did", "will", "would",
                "should", "may", "might", "must", "can", "could", "this", "that",
                "these", "those", "i", "you", "he", "she", "it", "we", "they",
                "my", "your", "his", "her", "its", "our", "their", "me", "him",
                "us", "them", "what", "which", "who", "whom", "when", "where",
                "why", "how", "about", "with", "from", "into", "through",
                "qual", "meu", "minha", "para", "como", "sobre", "uma", "um",
                "de", "da", "do", "em", "no", "na", "que", "foi", "foram",
                "esta", "estao", "ser", "ter", "fazer", "preciso", "precisar",
                "quero", "querer", "gostaria", "poderia", "pode", "posso",
                "vou", "vai", "vamos", "tem", "tinha", "era", "eram",
                "coisa", "coisas", "algo", "nada", "tudo", "mais", "menos"
        ));
    }

    @Transactional
    public void indexAllUserData(UUID userId) {
        log.info("🔄 Indexing ALL data for user: {}", userId);

        List<MemoryEntry> oldMemories = memoryEntryRepository.findByUserIdOrderByCreatedAtDesc(userId);
        memoryEntryRepository.deleteAll(oldMemories);
        log.info("🗑️ Deleted {} old memory entries", oldMemories.size());

        noteRepository.findAllActiveByUserId(userId).forEach(n -> {
            if (!Boolean.TRUE.equals(n.getIsFolder())) indexNote(n.getId(), userId);
        });
        conversationRepository.findAllActiveByUserId(userId).forEach(c -> indexConversation(c.getId(), userId));
        contactRepository.findByUserIdOrderByNameAsc(userId).forEach(c -> indexContact(c.getId(), userId));
        reminderRepository.findByUserIdOrderByReminderTimeAsc(userId).forEach(r -> indexReminder(r.getId(), userId));
        spreadsheetRepository.findByUserIdOrderByUpdatedAtDesc(userId).forEach(s -> indexSpreadsheet(s.getId(), userId));
        chartRepository.findByUserIdOrderByUpdatedAtDesc(userId).forEach(c -> indexChart(c.getId(), userId));
        calendarEventRepository.findByUserIdOrderByDateAsc(userId).forEach(e -> indexCalendarEvent(e.getId(), userId));
        userFileRepository.findByUserIdOrderByCreatedAtDesc(userId).forEach(f -> indexFile(f.getId(), userId));
        whiteboardRepository.findByUserIdOrderByUpdatedAtDesc(userId).forEach(w -> indexWhiteboard(w.getId(), userId));

        log.info("✅ Indexing complete for user: {}", userId);
    }

    public String buildMemoryContext(UUID userId, String userMessage) {
        List<MemoryEntry> relevantMemories = findRelevantMemories(userId, userMessage, 10);

        if (relevantMemories.isEmpty()) return null;

        StringBuilder context = new StringBuilder();
        context.append("=== USER MEMORY ===\n");
        context.append("The user has the following data in their platform. Use this to answer:\n\n");

        Map<String, List<MemoryEntry>> byCategory = relevantMemories.stream()
                .collect(Collectors.groupingBy(MemoryEntry::getCategory));

        for (Map.Entry<String, List<MemoryEntry>> entry : byCategory.entrySet()) {
            context.append("📌 ").append(entry.getKey().toUpperCase()).append(":\n");
            for (MemoryEntry m : entry.getValue()) {
                context.append("  - ").append(m.getTopic()).append(": ");
                context.append(truncate(stripHtml(m.getContent()), 400));
                context.append("\n");
            }
            context.append("\n");
        }

        context.append("=== END USER MEMORY ===\n");
        context.append("IMPORTANT: Use the above data to answer the user's question.");

        return context.toString();
    }
}