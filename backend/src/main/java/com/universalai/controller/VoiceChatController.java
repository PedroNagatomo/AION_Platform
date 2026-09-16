package com.universalai.controller;

import com.universalai.ai.model.AIRequest;
import com.universalai.ai.model.AIResponse;
import com.universalai.ai.model.ChatMessage;
import com.universalai.ai.provider.AIProvider;
import com.universalai.service.MemoryService;
import com.universalai.service.VoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/voice-chat")
@RequiredArgsConstructor
public class VoiceChatController {

    private final AIProvider aiProvider;
    private final VoiceService voiceService;
    private final MemoryService memoryService;

    /**
     * Recebe texto do usuário, processa com IA, retorna texto + áudio
     */
    @PostMapping("/respond")
    public ResponseEntity<Map<String, Object>> respond(@RequestBody Map<String, String> request) {
        String userText = request.get("text");
        String language = request.getOrDefault("language", "pt-BR");

        // Construir prompt para o JARVIS
        List<ChatMessage> messages = new ArrayList<>();

        String systemPrompt = language.equals("pt-BR")
                ? "Você é o JARVIS, um assistente de IA amigável e prestativo. " +
                "Responda em português brasileiro. " +
                "Seja natural, como um assistente pessoal. " +
                "Se o usuário perguntar sobre navegação, diga que pode navegar. " +
                "Responda de forma concisa (máximo 2-3 frases para respostas faladas)."
                : "You are JARVIS, a friendly and helpful AI assistant. " +
                "Respond in English. " +
                "Be natural, like a personal assistant. " +
                "Respond concisely (max 2-3 sentences for spoken responses).";

        messages.add(ChatMessage.builder()
                .role("system")
                .content(systemPrompt)
                .build());

        messages.add(ChatMessage.builder()
                .role("user")
                .content(userText)
                .build());

        AIRequest aiRequest = AIRequest.builder()
                .messages(messages)
                .temperature(0.7)
                .maxTokens(200)
                .build();

        AIResponse aiResponse = aiProvider.chat(aiRequest);

        // Sintetizar voz
        byte[] audio = voiceService.synthesizeSpeech(aiResponse.getContent(), language);

        Map<String, Object> result = new HashMap<>();
        result.put("text", aiResponse.getContent());
        result.put("audio", audio != null ? Base64.getEncoder().encodeToString(audio) : null);

        return ResponseEntity.ok(result);
    }
}