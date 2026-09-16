package com.universalai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.universalai.entity.Conversation;
import com.universalai.entity.Message;
import com.universalai.entity.Note;
import com.universalai.entity.User;
import com.universalai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final NoteRepository noteRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * Exporta uma conversa como Markdown
     */
    public String exportConversationAsMarkdown(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository
                .findActiveByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        StringBuilder markdown = new StringBuilder();

        // Header
        markdown.append("# ").append(conversation.getTitle() != null ? conversation.getTitle() : "Conversation").append("\n\n");
        markdown.append("**Date:** ").append(conversation.getCreatedAt().format(DATE_FORMAT)).append("\n");
        markdown.append("**Messages:** ").append(messages.size()).append("\n\n");
        markdown.append("---\n\n");

        // Messages
        for (Message message : messages) {
            String role = message.getRole() == Message.MessageRole.USER ? "🧑 User" : "🤖 AI";
            markdown.append("### ").append(role).append("\n\n");
            markdown.append(message.getContent()).append("\n\n");
            markdown.append("*").append(message.getCreatedAt().format(DATE_FORMAT)).append("*\n\n");
            markdown.append("---\n\n");
        }

        return markdown.toString();
    }

    /**
     * Exporta uma conversa como TXT (plain text)
     */
    public String exportConversationAsTxt(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository
                .findActiveByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        StringBuilder txt = new StringBuilder();

        txt.append("=== ").append(conversation.getTitle() != null ? conversation.getTitle() : "Conversation").append(" ===\n");
        txt.append("Date: ").append(conversation.getCreatedAt().format(DATE_FORMAT)).append("\n");
        txt.append("Messages: ").append(messages.size()).append("\n\n");

        for (Message message : messages) {
            String role = message.getRole() == Message.MessageRole.USER ? "USER" : "AI";
            txt.append("[").append(role).append("] ")
                    .append(message.getCreatedAt().format(DATE_FORMAT))
                    .append("\n");
            txt.append(message.getContent()).append("\n\n");
            txt.append("----------------------------------------\n\n");
        }

        return txt.toString();
    }

    /**
     * Exporta uma nota como Markdown
     */
    public String exportNoteAsMarkdown(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        if (!note.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        StringBuilder markdown = new StringBuilder();

        markdown.append("# ").append(note.getTitle()).append("\n\n");

        if (note.getTags() != null && !note.getTags().isEmpty()) {
            markdown.append("**Tags:** ").append(note.getTags()).append("\n\n");
        }

        markdown.append("**Created:** ").append(note.getCreatedAt().format(DATE_FORMAT)).append("\n");
        markdown.append("**Updated:** ").append(note.getUpdatedAt().format(DATE_FORMAT)).append("\n\n");
        markdown.append("---\n\n");

        if (note.getContent() != null) {
            markdown.append(note.getContent());
        }

        return markdown.toString();
    }

    /**
     * Exporta uma nota como TXT
     */
    public String exportNoteAsTxt(UUID noteId, UUID userId) {
        Note note = noteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        if (!note.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        StringBuilder txt = new StringBuilder();

        txt.append("=== ").append(note.getTitle()).append(" ===\n");
        txt.append("Created: ").append(note.getCreatedAt().format(DATE_FORMAT)).append("\n");
        txt.append("Updated: ").append(note.getUpdatedAt().format(DATE_FORMAT)).append("\n\n");

        if (note.getContent() != null) {
            // Remover tags HTML básicas para texto puro
            String plainText = note.getContent()
                    .replaceAll("<[^>]+>", "")
                    .replaceAll("&nbsp;", " ")
                    .replaceAll("&amp;", "&")
                    .replaceAll("&lt;", "<")
                    .replaceAll("&gt;", ">");
            txt.append(plainText);
        }

        return txt.toString();
    }

    /**
     * Exporta backup completo do usuário em JSON
     */
    public Map<String, Object> exportFullBackup(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> backup = new HashMap<>();

        // User info
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("email", user.getEmail());
        userInfo.put("name", user.getName());
        userInfo.put("memory", user.getMemory());
        userInfo.put("createdAt", user.getCreatedAt());
        backup.put("user", userInfo);

        // Conversations with messages
        List<Map<String, Object>> conversationsData = new ArrayList<>();
        List<Conversation> conversations = conversationRepository.findAllActiveByUserId(userId);

        for (Conversation conv : conversations) {
            Map<String, Object> convData = new HashMap<>();
            convData.put("id", conv.getId());
            convData.put("title", conv.getTitle());
            convData.put("createdAt", conv.getCreatedAt());
            convData.put("updatedAt", conv.getUpdatedAt());

            List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId());
            List<Map<String, Object>> messagesData = messages.stream().map(msg -> {
                Map<String, Object> msgData = new HashMap<>();
                msgData.put("id", msg.getId());
                msgData.put("role", msg.getRole().toString());
                msgData.put("content", msg.getContent());
                msgData.put("tokenCount", msg.getTokenCount());
                msgData.put("createdAt", msg.getCreatedAt());
                return msgData;
            }).collect(Collectors.toList());

            convData.put("messages", messagesData);
            conversationsData.add(convData);
        }
        backup.put("conversations", conversationsData);

        // Notes
        List<Note> notes = noteRepository.findAllActiveByUserId(userId);
        List<Map<String, Object>> notesData = notes.stream().map(note -> {
            Map<String, Object> noteData = new HashMap<>();
            noteData.put("id", note.getId());
            noteData.put("title", note.getTitle());
            noteData.put("content", note.getContent());
            noteData.put("parentId", note.getParentId());
            noteData.put("isFolder", note.getIsFolder());
            noteData.put("tags", note.getTags());
            noteData.put("icon", note.getIcon());
            noteData.put("createdAt", note.getCreatedAt());
            noteData.put("updatedAt", note.getUpdatedAt());
            return noteData;
        }).collect(Collectors.toList());
        backup.put("notes", notesData);

        backup.put("exportedAt", LocalDateTime.now().format(DATE_FORMAT));
        backup.put("version", "1.0");

        return backup;
    }
}