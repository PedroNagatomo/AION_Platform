package com.universalai.controller;

import com.universalai.entity.User;
import com.universalai.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NoteRepository noteRepository;
    private final SpreadsheetRepository spreadsheetRepository;
    private final ChartRepository chartRepository;
    private final ContactRepository contactRepository;
    private final ReminderRepository reminderRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final UserFileRepository userFileRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getAdvancedDashboard() {
        UUID userId = getCurrentUserId();

        Map<String, Object> analytics = new HashMap<>();

        // 1. Uso diário (últimos 7 dias)
        analytics.put("dailyUsage", getDailyUsage(userId));

        // 2. Atividade por hora
        analytics.put("hourlyActivity", getHourlyActivity(userId));

        // 3. Módulos mais usados
        analytics.put("moduleUsage", getModuleUsage(userId));

        // 4. Tendência de tokens (últimos 7 dias)
        analytics.put("tokenTrend", getTokenTrend(userId));

        // 5. Resumo geral
        analytics.put("summary", getSummary(userId));

        return ResponseEntity.ok(analytics);
    }

    private List<Map<String, Object>> getDailyUsage(UUID userId) {
        List<Map<String, Object>> dailyUsage = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

            long messages = messageRepository.countByUserIdAndCreatedAtBetween(userId, startOfDay, endOfDay);
            long conversations = conversationRepository.findAllActiveByUserId(userId).stream()
                    .filter(c -> c.getCreatedAt().toLocalDate().equals(date))
                    .count();
            long notes = noteRepository.findAllActiveByUserId(userId).stream()
                    .filter(n -> n.getCreatedAt().toLocalDate().equals(date))
                    .count();

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.format(DateTimeFormatter.ofPattern("MMM dd")));
            dayData.put("messages", messages);
            dayData.put("conversations", conversations);
            dayData.put("notes", notes);
            dailyUsage.add(dayData);
        }

        return dailyUsage;
    }

    private List<Map<String, Object>> getHourlyActivity(UUID userId) {
        List<Map<String, Object>> hourlyActivity = new ArrayList<>();

        for (int hour = 0; hour < 24; hour++) {
            LocalDateTime start = LocalDate.now().atTime(hour, 0);
            LocalDateTime end = LocalDate.now().atTime(hour, 59, 59);

            long messages = messageRepository.countByUserIdAndCreatedAtBetween(userId, start, end);

            Map<String, Object> hourData = new HashMap<>();
            hourData.put("hour", String.format("%02d:00", hour));
            hourData.put("activity", messages);
            hourlyActivity.add(hourData);
        }

        return hourlyActivity;
    }

    private Map<String, Object> getModuleUsage(UUID userId) {
        Map<String, Object> moduleUsage = new HashMap<>();

        moduleUsage.put("conversations", conversationRepository.findAllActiveByUserId(userId).size());
        moduleUsage.put("notes", noteRepository.findAllActiveByUserId(userId).size());
        moduleUsage.put("spreadsheets", spreadsheetRepository.findByUserIdOrderByUpdatedAtDesc(userId).size());
        moduleUsage.put("charts", chartRepository.findByUserIdOrderByUpdatedAtDesc(userId).size());
        moduleUsage.put("contacts", contactRepository.findByUserIdOrderByNameAsc(userId).size());
        moduleUsage.put("reminders", reminderRepository.findByUserIdOrderByReminderTimeAsc(userId).size());
        moduleUsage.put("events", calendarEventRepository.findByUserIdOrderByDateAsc(userId).size());
        moduleUsage.put("files", userFileRepository.findByUserIdOrderByCreatedAtDesc(userId).size());

        return moduleUsage;
    }

    private List<Map<String, Object>> getTokenTrend(UUID userId) {
        List<Map<String, Object>> tokenTrend = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime startOfDay = date.atStartOfDay();
            LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

            Long tokens = messageRepository.sumTokensByUserIdAndDateRange(userId, startOfDay, endOfDay);

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.format(DateTimeFormatter.ofPattern("MMM dd")));
            dayData.put("tokens", tokens != null ? tokens : 0);
            tokenTrend.add(dayData);
        }

        return tokenTrend;
    }

    private Map<String, Object> getSummary(UUID userId) {
        Map<String, Object> summary = new HashMap<>();

        summary.put("totalMessages", messageRepository.countByUserId(userId));
        summary.put("totalConversations", conversationRepository.findAllActiveByUserId(userId).size());
        summary.put("totalNotes", noteRepository.findAllActiveByUserId(userId).size());
        summary.put("totalTokens", messageRepository.sumTokensByUserId(userId) != null ? messageRepository.sumTokensByUserId(userId) : 0);
        summary.put("totalFiles", userFileRepository.findByUserIdOrderByCreatedAtDesc(userId).size());
        summary.put("totalReminders", reminderRepository.findByUserIdOrderByReminderTimeAsc(userId).size());
        summary.put("activeReminders", reminderRepository.findByUserIdAndIsCompletedFalseOrderByReminderTimeAsc(userId).size());

        // Módulo mais usado
        Map<String, Object> moduleUsage = getModuleUsage(userId);
        String mostUsedModule = moduleUsage.entrySet().stream()
                .max(Map.Entry.comparingByValue(Comparator.comparingInt(v -> (Integer) v)))
                .map(Map.Entry::getKey)
                .orElse("none");
        summary.put("mostUsedModule", mostUsedModule);

        return summary;
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}