package com.universalai.ai.service;

import com.universalai.ai.model.AIRequest;
import com.universalai.ai.model.AIResponse;
import com.universalai.ai.model.ChatMessage;
import com.universalai.ai.provider.AIProvider;
import com.universalai.entity.Attachment;
import com.universalai.entity.Message;
import com.universalai.service.AdvancedMemoryService;
import com.universalai.service.MemoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIOrchestrationService {

    private final AIProvider aiProvider;
    private final MemoryService memoryService;
    private final AdvancedMemoryService advancedMemoryService; // NOVO

    private static final int TOKEN_LIMIT = 131072;
    private static final int ESTIMATED_CHARS_PER_TOKEN = 4;
    private static final int MAX_HISTORY_MESSAGES = 20;
    private static final int SUMMARY_THRESHOLD_MESSAGES = 15;
    private static final int MAX_FILE_CONTENT_LENGTH = 8000;

    public AIResponse generateResponse(List<Message> conversationHistory, String userMessage) {
        return generateResponse(conversationHistory, userMessage, null);
    }

    public AIResponse generateResponse(List<Message> conversationHistory, String userMessage, UUID userId) {
        List<ChatMessage> aiMessages = buildContextWithSmartWindow(conversationHistory, userMessage, userId, null);

        AIRequest request = AIRequest.builder()
                .messages(aiMessages)
                .temperature(0.7)
                .maxTokens(4096)
                .build();

        log.debug("Enviando {} mensagens para o provedor de IA (com memória: {})",
                aiMessages.size(), userId != null);
        return aiProvider.chat(request);
    }

    public AIResponse generateResponseWithAttachments(
            List<Message> conversationHistory,
            String userMessage,
            UUID userId,
            List<Attachment> attachments) {

        List<ChatMessage> aiMessages = buildContextWithSmartWindow(conversationHistory, userMessage, userId, attachments);

        AIRequest request = AIRequest.builder()
                .messages(aiMessages)
                .temperature(0.7)
                .maxTokens(4096)
                .build();

        log.debug("Enviando {} mensagens para o provedor de IA", aiMessages.size());
        return aiProvider.chat(request);
    }

    public AIResponse generateResponseWithAgent(
            List<Message> conversationHistory,
            String userMessage,
            UUID userId,
            String agentSystemPrompt) {

        List<ChatMessage> aiMessages = new ArrayList<>();

        // System prompt do agente ou padrão
        String systemPrompt = agentSystemPrompt != null
                ? agentSystemPrompt
                : "You are a helpful AI assistant.";

        // ADICIONAR MEMÓRIA SEMÂNTICA AVANÇADA
        if (userId != null) {
            String memoryContext = advancedMemoryService.buildMemoryContext(userId, userMessage);
            if (memoryContext != null) {
                systemPrompt += "\n\n" + memoryContext;
                log.info("🧠 Memory context injected into system prompt");
            } else {
                log.info("⚠️ No relevant memories found for: '{}'", userMessage);
            }
        }

        aiMessages.add(ChatMessage.builder()
                .role("system")
                .content(systemPrompt)
                .build());

        // Histórico
        int maxHistory = 10;
        int start = Math.max(0, conversationHistory.size() - maxHistory);
        for (int i = start; i < conversationHistory.size(); i++) {
            Message msg = conversationHistory.get(i);
            aiMessages.add(ChatMessage.builder()
                    .role(msg.getRole().toString().toLowerCase())
                    .content(msg.getContent())
                    .build());
        }

        // Mensagem do usuário
        aiMessages.add(ChatMessage.builder()
                .role("user")
                .content(userMessage)
                .build());

        AIRequest request = AIRequest.builder()
                .messages(aiMessages)
                .temperature(0.7)
                .maxTokens(4096)
                .build();

        return aiProvider.chat(request);
    }

    public AIResponse generateResponseWithAgentAndAttachments(
            List<Message> conversationHistory,
            String userMessage,
            UUID userId,
            String agentSystemPrompt,
            List<Attachment> attachments) {

        List<ChatMessage> aiMessages = new ArrayList<>();

        String systemPrompt = agentSystemPrompt != null
                ? agentSystemPrompt
                : "You are a helpful AI assistant.";

        // ADICIONAR MEMÓRIA SEMÂNTICA
        if (userId != null) {
            String memoryContext = advancedMemoryService.buildMemoryContext(userId, userMessage);
            if (memoryContext != null) {
                systemPrompt += "\n\n" + memoryContext;
            }
        }

        aiMessages.add(ChatMessage.builder()
                .role("system")
                .content(systemPrompt)
                .build());

        int maxHistory = 10;
        int start = Math.max(0, conversationHistory.size() - maxHistory);
        for (int i = start; i < conversationHistory.size(); i++) {
            Message msg = conversationHistory.get(i);
            aiMessages.add(ChatMessage.builder()
                    .role(msg.getRole().toString().toLowerCase())
                    .content(msg.getContent())
                    .build());
        }

        StringBuilder userContent = new StringBuilder(userMessage != null ? userMessage : "");
        for (Attachment attachment : attachments) {
            if (attachment.getContent() != null) {
                userContent.append("\n\n=== FILE: ")
                        .append(attachment.getFileName())
                        .append(" ===\n")
                        .append(truncateContent(attachment.getContent(), MAX_FILE_CONTENT_LENGTH))
                        .append("\n=== END FILE ===");
            }
        }

        aiMessages.add(ChatMessage.builder()
                .role("user")
                .content(userContent.toString())
                .build());

        AIRequest request = AIRequest.builder()
                .messages(aiMessages)
                .build();

        return aiProvider.chat(request);
    }

    private List<ChatMessage> buildContextWithSmartWindow(
            List<Message> conversationHistory,
            String userMessage,
            UUID userId,
            List<Attachment> attachments) {

        List<ChatMessage> aiMessages = new ArrayList<>();

        String systemPrompt = buildSystemPrompt(userId, userMessage);
        aiMessages.add(ChatMessage.builder()
                .role("system")
                .content(systemPrompt)
                .build());

        if (conversationHistory.size() <= MAX_HISTORY_MESSAGES) {
            for (Message msg : conversationHistory) {
                aiMessages.add(convertMessage(msg));
            }
        } else {
            for (int i = 0; i < Math.min(2, conversationHistory.size()); i++) {
                aiMessages.add(convertMessage(conversationHistory.get(i)));
            }
            if (conversationHistory.size() > SUMMARY_THRESHOLD_MESSAGES) {
                String middleSummary = generateMiddleSummary(conversationHistory);
                aiMessages.add(ChatMessage.builder()
                        .role("system")
                        .content("[RESUMO]: " + middleSummary)
                        .build());
            }
            int recentStart = conversationHistory.size() - (MAX_HISTORY_MESSAGES - 3);
            for (int i = recentStart; i < conversationHistory.size(); i++) {
                aiMessages.add(convertMessage(conversationHistory.get(i)));
            }
        }

        String userContent = buildUserContent(userMessage, attachments);
        aiMessages.add(ChatMessage.builder()
                .role("user")
                .content(userContent)
                .build());

        return aiMessages;
    }

    private String buildSystemPrompt(UUID userId, String userMessage) {
        StringBuilder systemPrompt = new StringBuilder();

        systemPrompt.append("You are an AI assistant with FULL ACCESS to the user's personal data ");
        systemPrompt.append("stored in their Universal AI platform. This includes:\n");
        systemPrompt.append("- Notes (their personal notes and documents)\n");
        systemPrompt.append("- Contacts (name, phone, email)\n");
        systemPrompt.append("- Reminders (with dates)\n");
        systemPrompt.append("- Spreadsheets (with data)\n");
        systemPrompt.append("- Charts (with data)\n");
        systemPrompt.append("- Calendar events\n");
        systemPrompt.append("- Files\n");
        systemPrompt.append("- Whiteboards\n\n");

        systemPrompt.append("IMPORTANT RULES:\n");
        systemPrompt.append("1. When the user asks about their data (contacts, files, reminders, etc.), ");
        systemPrompt.append("ALWAYS use the provided memory context to give specific answers.\n");
        systemPrompt.append("2. List actual names, dates, values - not generic answers.\n");
        systemPrompt.append("3. If the memory contains relevant data, quote it directly.\n");
        systemPrompt.append("4. Be personal and context-aware.\n\n");

        // MEMÓRIA SEMÂNTICA
        if (userId != null) {
            String memoryContext = advancedMemoryService.buildMemoryContext(userId, userMessage);
            if (memoryContext != null && !memoryContext.isEmpty()) {
                systemPrompt.append(memoryContext);
                log.info("🧠 Memory injected for query: '{}'", userMessage);
            }
        }

        // MEMÓRIA DE CONVERSAS ANTERIORES
        if (userId != null) {
            String userMemory = memoryService.getUserMemory(userId);
            if (userMemory != null && !userMemory.isEmpty()) {
                systemPrompt.append("\n=== PREVIOUS CONVERSATION MEMORY ===\n");
                systemPrompt.append(userMemory);
                systemPrompt.append("\n=== END ===");
            }
        }

        return systemPrompt.toString();
    }

    private String generateMiddleSummary(List<Message> history) {
        int summaryStart = 2;
        int summaryEnd = Math.max(summaryStart + 1, history.size() - (MAX_HISTORY_MESSAGES - 3));
        if (summaryEnd <= summaryStart) return "";
        List<Message> middleMessages = history.subList(summaryStart, summaryEnd);
        StringBuilder summaryText = new StringBuilder();
        for (int i = 0; i < Math.min(middleMessages.size(), 10); i++) {
            Message msg = middleMessages.get(i);
            String content = msg.getContent();
            if (content.length() > 200) content = content.substring(0, 200) + "...";
            summaryText.append("- ").append(content).append("\n");
        }
        return summaryText.toString();
    }

    private String buildUserContent(String userMessage, List<Attachment> attachments) {
        StringBuilder userContent = new StringBuilder(
                userMessage != null && !userMessage.trim().isEmpty()
                        ? userMessage
                        : "Analyze the attached file(s)."
        );
        if (attachments != null && !attachments.isEmpty()) {
            for (Attachment attachment : attachments) {
                if (attachment.getContent() != null) {
                    userContent.append("\n\n=== FILE: ")
                            .append(attachment.getFileName())
                            .append(" ===\n")
                            .append(truncateContent(attachment.getContent(), MAX_FILE_CONTENT_LENGTH))
                            .append("\n=== END FILE ===");
                }
            }
        }
        return userContent.toString();
    }

    private ChatMessage convertMessage(Message msg) {
        return ChatMessage.builder()
                .role(msg.getRole().toString().toLowerCase())
                .content(msg.getContent())
                .build();
    }

    private String truncateContent(String content, int maxLength) {
        if (content == null) return "";
        if (content.length() <= maxLength) return content;
        return content.substring(0, maxLength) + "\n... (truncated)";
    }

    public int estimateTokens(List<Message> messages) {
        int totalChars = messages.stream()
                .mapToInt(m -> m.getContent() != null ? m.getContent().length() : 0)
                .sum();
        return totalChars / ESTIMATED_CHARS_PER_TOKEN;
    }

    public AIResponse chat(AIRequest request) {
        return aiProvider.chat(request);
    }
}