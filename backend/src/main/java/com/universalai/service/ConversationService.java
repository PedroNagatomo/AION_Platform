package com.universalai.service;

import com.universalai.ai.model.AIResponse;
import com.universalai.ai.service.AIOrchestrationService;
import com.universalai.dto.MessageRequest;
import com.universalai.dto.MessageResponse;
import com.universalai.dto.UpdateMessageRequest;
import com.universalai.entity.Attachment;
import com.universalai.entity.Conversation;
import com.universalai.entity.Message;
import com.universalai.entity.User;
import com.universalai.repository.ConversationRepository;
import com.universalai.repository.MessageRepository;
import com.universalai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final AIOrchestrationService aiOrchestrationService;
    private final MemoryService memoryService;
    private final FileService fileService;
    private final AgentService agentService;
    private final AdvancedMemoryService advancedMemoryService;
    private final WorkflowService workflowService;


    private static final int TOKEN_LIMIT = 131072;
    private static final double WARNING_THRESHOLD = 0.7;

    @Transactional
    public Conversation createConversation(UUID userId, String title) {
        log.debug("Criando conversa para usuário: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + userId));

        Conversation conversation = Conversation.builder()
                .user(user)
                .title(title != null ? title : "Nova Conversa")
                .build();

        return conversationRepository.save(conversation);
    }

    @Transactional(readOnly = true)
    public List<Conversation> getUserConversations(UUID userId) {
        return conversationRepository.findAllActiveByUserId(userId);
    }

    /**
     * Envia mensagem simples (sem arquivos)
     */
    @Transactional
    public MessageResponse sendMessage(UUID conversationId, UUID userId, String content, MultipartFile[] files) {
        Conversation conversation = conversationRepository
                .findActiveByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Conversa não encontrada"));

        // Salvar mensagem do usuário
        Message userMessage = Message.builder()
                .conversation(conversation)
                .role(Message.MessageRole.USER)
                .content(content != null ? content : "")
                .build();

        // Processar arquivos anexados
        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    try {
                        Attachment attachment = fileService.processFile(file);
                        userMessage.addAttachment(attachment);
                    } catch (IOException e) {
                        log.error("Erro ao processar arquivo: {}", file.getOriginalFilename(), e);
                    }
                }
            }
        }

        messageRepository.save(userMessage);

        // Buscar histórico
        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        // Gerar resposta da IA com anexos
        AIResponse aiResponse;
        if (userMessage.getAttachments() != null && !userMessage.getAttachments().isEmpty()) {
            aiResponse = aiOrchestrationService.generateResponseWithAttachments(
                    history, content, userId, userMessage.getAttachments());
        } else {
            aiResponse = aiOrchestrationService.generateResponse(history, content, userId);
        }

        // Salvar resposta
        Message assistantMessage = Message.builder()
                .conversation(conversation)
                .role(Message.MessageRole.ASSISTANT)
                .content(aiResponse.getContent())
                .tokenCount(aiResponse.getTotalTokens())
                .build();

        messageRepository.save(assistantMessage);

        return MessageResponse.fromEntity(assistantMessage);
    }

    /**
     * Envia mensagem com possibilidade de arquivos
     */
    @Transactional
    public MessageResponse sendMessageWithFiles(UUID conversationId, UUID userId, String content, MultipartFile[] files) {
        log.debug("Enviando mensagem para conversa: {} do usuário: {}", conversationId, userId);

        // Buscar a conversa
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversa não encontrada: " + conversationId));

        // Verificar se a conversa pertence ao usuário
        if (!conversation.getUser().getId().equals(userId)) {
            log.error("Usuário {} tentou acessar conversa {} do usuário {}",
                    userId, conversationId, conversation.getUser().getId());
            throw new RuntimeException("Acesso negado à conversa");
        }

        // Processar arquivos se houver
        List<Attachment> attachments = new ArrayList<>();
        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                try {
                    Attachment attachment = fileService.processFile(file);
                    attachments.add(attachment);
                } catch (IOException e) {
                    log.error("Erro ao processar arquivo: {}", file.getOriginalFilename(), e);
                    throw new RuntimeException("Erro ao processar arquivo: " + file.getOriginalFilename());
                }
            }
        }

        // Construir conteúdo da mensagem
        StringBuilder messageContent = new StringBuilder();
        if (content != null && !content.trim().isEmpty()) {
            messageContent.append(content);
        }

        // Adicionar nomes dos arquivos anexados
        if (!attachments.isEmpty()) {
            if (messageContent.length() > 0) {
                messageContent.append("\n\n");
            }
            messageContent.append("📎 Arquivos anexados:\n");
            for (Attachment attachment : attachments) {
                messageContent.append("- ").append(attachment.getFileName())
                        .append(" (").append(formatFileSize(attachment.getFileSize())).append(")\n");
            }
        }

        // Salvar mensagem do usuário
        Message userMessage = Message.builder()
                .conversation(conversation)
                .role(Message.MessageRole.USER)
                .content(messageContent.toString())
                .build();

        // Associar anexos à mensagem
        for (Attachment attachment : attachments) {
            userMessage.addAttachment(attachment);
        }

        messageRepository.save(userMessage);
        log.debug("Mensagem do usuário salva: {}", userMessage.getId());

        // Buscar histórico da conversa
        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        log.debug("Histórico carregado: {} mensagens", history.size());

        // Gerar resposta da IA com memória e anexos
        log.debug("Chamando IA com memória e {} anexos...", attachments.size());
        AIResponse aiResponse;
        if (!attachments.isEmpty()) {
            aiResponse = aiOrchestrationService.generateResponseWithAttachments(history, content, userId, attachments);
        } else {
            aiResponse = aiOrchestrationService.generateResponse(history, content, userId);
        }
        log.debug("Resposta da IA recebida: {} tokens", aiResponse.getTotalTokens());

        // Salvar resposta do assistente
        Message assistantMessage = Message.builder()
                .conversation(conversation)
                .role(Message.MessageRole.ASSISTANT)
                .content(aiResponse.getContent())
                .tokenCount(aiResponse.getTotalTokens())
                .build();

        messageRepository.save(assistantMessage);
        log.debug("Resposta do assistente salva: {}", assistantMessage.getId());

        // Atualizar título da conversa se for a primeira mensagem
        if (history.size() == 0) {
            conversation.setTitle(generateConversationTitle(content != null ? content : "Nova Conversa"));
            conversationRepository.save(conversation);
        }

        return MessageResponse.fromEntity(assistantMessage);
    }

    /**
     * Encerra uma conversa e atualiza a memória de longo prazo do usuário
     */
    @Transactional
    public void endConversation(UUID conversationId, UUID userId) {
        log.debug("Encerrando conversa: {} do usuário: {}", conversationId, userId);

        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversa não encontrada"));

        if (!conversation.getUser().getId().equals(userId)) {
            throw new RuntimeException("Acesso negado à conversa");
        }

        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        if (messages.size() >= 6) {
            memoryService.updateMemory(userId, messages);
            advancedMemoryService.indexConversation(conversationId, userId);
        }

        // DISPARAR WORKFLOW - CONVERSATION_ENDED
        if (messages.size() >= 2) {
            // Construir o transcript COMPLETO da conversa
            StringBuilder fullTranscript = new StringBuilder();
            for (Message msg : messages) {
                String role = msg.getRole() == Message.MessageRole.USER ? "USER" : "AI";
                fullTranscript.append("[").append(role).append("]: ");
                fullTranscript.append(msg.getContent() != null ? msg.getContent() : "");
                fullTranscript.append("\n\n");
            }

            // Construir o texto da conversa em formato legível
            StringBuilder conversationText = new StringBuilder();
            conversationText.append("=== CONVERSATION TRANSCRIPT ===\n");
            conversationText.append("Title: ").append(conversation.getTitle()).append("\n");
            conversationText.append("Total messages: ").append(messages.size()).append("\n\n");
            conversationText.append(fullTranscript.toString());
            conversationText.append("=== END TRANSCRIPT ===");

            Map<String, Object> eventData = new HashMap<>();
            eventData.put("id", conversationId.toString());
            eventData.put("title", conversation.getTitle() != null ? conversation.getTitle() : "Conversation");
            eventData.put("messageCount", messages.size());
            eventData.put("transcript", conversationText.toString()); // ← TRANSCRIPT COMPLETO
            eventData.put("fullContent", fullTranscript.toString());  // ← CONTEÚDO COMPLETO
            eventData.put("category", "conversation");

            log.info("📤 Triggering CONVERSATION_ENDED with {} messages, transcript size: {} chars",
                    messages.size(), conversationText.length());
            workflowService.triggerWorkflows(userId, "CONVERSATION_ENDED", eventData);
        }

        conversation.softDelete();
        conversationRepository.save(conversation);
        log.debug("Conversa encerrada: {}", conversationId);
    }

    @Transactional
    public void clearMemory(UUID userId) {
        log.debug("Limpando memória do usuário: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        user.setMemory(null);
        userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public String getUserMemory(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return user.getMemory();
    }

    @Transactional(readOnly = true)
    public List<MessageResponse> getConversationMessages(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversa não encontrada"));

        if (!conversation.getUser().getId().equals(userId)) {
            throw new RuntimeException("Acesso negado à conversa");
        }

        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(MessageResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse updateMessage(UUID conversationId, UUID messageId, UUID userId, UpdateMessageRequest request) {
        Message message = messageRepository.findByIdAndConversationIdAndUserId(messageId, conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Mensagem não encontrada"));

        if (message.getRole() != Message.MessageRole.USER) {
            throw new RuntimeException("Apenas mensagens do usuário podem ser editadas");
        }

        message.setContent(request.getContent());
        messageRepository.save(message);

        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        List<Message> historyBeforeEdit = history.stream()
                .filter(m -> m.getCreatedAt().isBefore(message.getCreatedAt()) || m.getId().equals(message.getId()))
                .collect(Collectors.toList());

        List<Message> messagesAfter = history.stream()
                .filter(m -> m.getCreatedAt().isAfter(message.getCreatedAt()))
                .collect(Collectors.toList());

        for (Message msg : messagesAfter) {
            messageRepository.delete(msg);
        }

        AIResponse aiResponse = aiOrchestrationService.generateResponse(historyBeforeEdit, request.getContent(), userId);

        Message assistantMessage = Message.builder()
                .conversation(message.getConversation())
                .role(Message.MessageRole.ASSISTANT)
                .content(aiResponse.getContent())
                .tokenCount(aiResponse.getTotalTokens())
                .build();

        messageRepository.save(assistantMessage);

        return MessageResponse.fromEntity(assistantMessage);
    }

    private String generateConversationTitle(String firstMessage) {
        if (firstMessage == null || firstMessage.trim().isEmpty()) {
            return "Nova Conversa";
        }
        if (firstMessage.length() <= 30) {
            return firstMessage;
        }
        return firstMessage.substring(0, 30) + "...";
    }

    private String formatFileSize(long size) {
        if (size < 1024) {
            return size + " B";
        } else if (size < 1024 * 1024) {
            return String.format("%.1f KB", size / 1024.0);
        } else {
            return String.format("%.1f MB", size / (1024.0 * 1024.0));
        }
    }

    /**
     * Verifica se a conversa está se aproximando do limite de tokens
     * e retorna um aviso se necessário
     */
    public String getTokenWarning(UUID conversationId) {
        List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        int estimatedTokens = aiOrchestrationService.estimateTokens(messages);
        double usageRatio = (double) estimatedTokens / TOKEN_LIMIT;

        if (usageRatio >= 0.95) {
            return "CRITICAL: Limite de tokens quase atingido (" +
                    String.format("%.1f", usageRatio * 100) + "%). Encerre a conversa para salvar memória.";
        } else if (usageRatio >= 0.85) {
            return "WARNING: Contexto crítico (" +
                    String.format("%.1f", usageRatio * 100) + "%). Considere encerrar a conversa em breve.";
        } else if (usageRatio >= 0.70) {
            return "INFO: Contexto está ficando grande (" +
                    String.format("%.1f", usageRatio * 100) + "%).";
        }

        return null;
    }

    /**
     * Adiciona resumo automático quando a conversa ultrapassa o limite
     */
    @Transactional
    public MessageResponse sendMessageWithAutoSummary(
            UUID conversationId,
            UUID userId,
            String content,
            MultipartFile[] files) {

        // Verificar se precisa resumir antes de enviar
        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        int estimatedTokens = aiOrchestrationService.estimateTokens(history);

        if (estimatedTokens > TOKEN_LIMIT * WARNING_THRESHOLD) {
            log.info("Conversa {} atingiu {} tokens. Gerando resumo automático...",
                    conversationId, estimatedTokens);

            // Gerar resumo e atualizar memória do usuário
            memoryService.updateMemory(userId, history);

            // Marcar mensagens antigas como resumidas (soft delete das antigas)
            // Mantém apenas as últimas 10 mensagens
            if (history.size() > 10) {
                List<Message> toDelete = history.subList(0, history.size() - 10);
                for (Message msg : toDelete) {
                    messageRepository.delete(msg);
                }
                log.info("{} mensagens antigas removidas (contexto comprimido)", toDelete.size());
            }
        }

        // Continuar com envio normal
        return sendMessageWithFiles(conversationId, userId, content, files);
    }

    @Transactional
    public Conversation updateConversationTitle(UUID conversationId, UUID userId, String newTitle) {
        Conversation conversation = conversationRepository
                .findActiveByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Conversa não encontrada"));

        if (newTitle != null && !newTitle.trim().isEmpty()) {
            conversation.setTitle(newTitle.trim());
            conversationRepository.save(conversation);
        }

        return conversation;
    }

    @Transactional
    public void deleteConversation(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository
                .findActiveByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Conversa não encontrada"));

        // Hard delete (remove permanentemente)
        conversationRepository.delete(conversation);
    }

    @Transactional
    public void deleteAllConversations(UUID userId) {
        List<Conversation> conversations = conversationRepository.findAllActiveByUserId(userId);
        conversationRepository.deleteAll(conversations);
    }

    @Transactional
    public Conversation togglePin(UUID conversationId, UUID userId) {
        Conversation conversation = conversationRepository
                .findActiveByIdAndUserId(conversationId, userId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        conversation.setPinned(!Boolean.TRUE.equals(conversation.getPinned()));
        return conversationRepository.save(conversation);
    }

    @Transactional
    public MessageResponse sendMessageWithFilesAndAgent(
            UUID conversationId,
            UUID userId,
            String content,
            MultipartFile[] files,
            UUID agentId) {

        log.debug("Sending message with agent: {}", agentId);

        // Buscar conversa
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        // Verificar permissão
        if (!conversation.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        // Buscar system prompt do agente
        String agentSystemPrompt = null;
        if (agentId != null) {
            agentSystemPrompt = agentService.getAgentSystemPrompt(agentId, userId);
        }

        // Processar arquivos
        List<Attachment> attachments = new ArrayList<>();
        if (files != null && files.length > 0) {
            for (MultipartFile file : files) {
                try {
                    Attachment attachment = fileService.processFile(file);
                    attachments.add(attachment);
                } catch (IOException e) {
                    log.error("Error processing file: {}", file.getOriginalFilename(), e);
                }
            }
        }

        // Salvar mensagem do usuário
        Message userMessage = Message.builder()
                .conversation(conversation)
                .role(Message.MessageRole.USER)
                .content(content != null ? content : "")
                .build();

        for (Attachment attachment : attachments) {
            userMessage.addAttachment(attachment);
        }

        messageRepository.save(userMessage);

        // Buscar histórico
        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        // Gerar resposta com agente
        AIResponse aiResponse;
        if (!attachments.isEmpty()) {
            aiResponse = aiOrchestrationService.generateResponseWithAgentAndAttachments(
                    history, content, userId, agentSystemPrompt, attachments);
        } else {
            aiResponse = aiOrchestrationService.generateResponseWithAgent(
                    history, content, userId, agentSystemPrompt);
        }

        // Salvar resposta
        Message assistantMessage = Message.builder()
                .conversation(conversation)
                .role(Message.MessageRole.ASSISTANT)
                .content(aiResponse.getContent())
                .tokenCount(aiResponse.getTotalTokens())
                .build();

        messageRepository.save(assistantMessage);

        return MessageResponse.fromEntity(assistantMessage);
    }
}