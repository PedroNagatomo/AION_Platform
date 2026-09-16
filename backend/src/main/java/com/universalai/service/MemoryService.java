package com.universalai.service;

import com.universalai.ai.model.AIRequest;
import com.universalai.ai.model.AIResponse;
import com.universalai.ai.model.ChatMessage;
import com.universalai.ai.provider.AIProvider;
import com.universalai.entity.Message;
import com.universalai.entity.User;
import com.universalai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MemoryService {

    private final AIProvider aiProvider;
    private final UserRepository userRepository;

    /**
     * Gera ou atualiza a memória de longo prazo do usuário
     * baseado na conversa que está sendo encerrada
     */
    @Transactional
    public void updateMemory(UUID userId, List<Message> conversationMessages) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        // Se a conversa for muito curta, não vale a pena resumir
        if (conversationMessages.size() < 6) {
            return;
        }

        String existingMemory = user.getMemory();
        String conversationSummary = generateSummary(conversationMessages);

        // Combinar memória existente com novo resumo
        String newMemory = combineMemories(existingMemory, conversationSummary);
        user.setMemory(newMemory);
        userRepository.save(user);

        log.debug("Memória atualizada para usuário: {}", userId);
    }

    /**
     * Gera um resumo da conversa usando IA
     */
    private String generateSummary(List<Message> messages) {
        // Pegar apenas as últimas 20 mensagens para resumir
        List<Message> recentMessages = messages.stream()
                .skip(Math.max(0, messages.size() - 20))
                .collect(Collectors.toList());

        // Construir o prompt de resumo
        StringBuilder conversationText = new StringBuilder();
        for (Message msg : recentMessages) {
            conversationText.append(msg.getRole())
                    .append(": ")
                    .append(msg.getContent())
                    .append("\n");
        }

        List<ChatMessage> aiMessages = new ArrayList<>();
        aiMessages.add(ChatMessage.builder()
                .role("system")
                .content("Você é um assistente que cria resumos de conversas. " +
                        "Crie um resumo conciso que capture os pontos principais, " +
                        "preferências do usuário, decisões tomadas e contexto importante. " +
                        "O resumo será usado como memória para futuras conversas.")
                .build());
        aiMessages.add(ChatMessage.builder()
                .role("user")
                .content("Resuma esta conversa em tópicos:\n\n" + conversationText.toString())
                .build());

        AIRequest request = AIRequest.builder()
                .messages(aiMessages)
                .temperature(0.3)
                .maxTokens(500)
                .build();

        AIResponse response = aiProvider.chat(request);
        return response.getContent();
    }

    /**
     * Combina memória existente com novo resumo
     */
    private String combineMemories(String existingMemory, String newSummary) {
        if (existingMemory == null || existingMemory.isEmpty()) {
            return "MEMÓRIA DE CONVERSAS ANTERIORES:\n" + newSummary;
        }

        // Manter memória existente e adicionar novo resumo
        // Limitar tamanho total para não ficar muito grande
        String combined = existingMemory + "\n\nATUALIZAÇÃO RECENTE:\n" + newSummary;

        // Limitar a memória a aproximadamente 2000 caracteres
        if (combined.length() > 2000) {
            combined = combined.substring(combined.length() - 2000);
        }

        return combined;
    }

    /**
     * Obtém a memória do usuário para injetar no system prompt
     */
    public String getUserMemory(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        return user.getMemory();
    }
}