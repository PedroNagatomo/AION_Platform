package com.universalai.controller;

import com.universalai.entity.User;
import com.universalai.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final UserRepository userRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NoteRepository noteRepository;
    private final SpreadsheetRepository spreadsheetRepository;
    private final ContactRepository contactRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final ChartRepository chartRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        UUID userId = getCurrentUserId();

        Map<String, Object> stats = new HashMap<>();

        // Counts
        stats.put("totalConversations", conversationRepository.findAllActiveByUserId(userId).size());
        stats.put("totalMessages", messageRepository.countByUserId(userId));
        stats.put("totalNotes", noteRepository.findAllActiveByUserId(userId).size());
        stats.put("totalSpreadsheets", spreadsheetRepository.findByUserIdOrderByUpdatedAtDesc(userId).size());
        stats.put("totalContacts", contactRepository.findByUserIdOrderByNameAsc(userId).size());
        stats.put("totalEvents", calendarEventRepository.findByUserIdOrderByDateAsc(userId).size());
        stats.put("totalCharts", chartRepository.findByUserIdOrderByUpdatedAtDesc(userId).size());

        // Total tokens used
        Long totalTokens = messageRepository.sumTokensByUserId(userId);
        stats.put("totalTokens", totalTokens != null ? totalTokens : 0);

        // Recent activity (last 5 conversations)
        stats.put("recentConversations", conversationRepository.findTop5ByUserIdOrderByUpdatedAtDesc(userId));

        return ResponseEntity.ok(stats);
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}