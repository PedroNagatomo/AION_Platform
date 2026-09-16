package com.universalai.ai.provider;

import com.universalai.ai.model.AIRequest;
import com.universalai.ai.model.AIResponse;
import com.universalai.ai.model.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Component
@Slf4j
public class GroqAIProvider implements AIProvider {

    private final RestTemplate restTemplate;

    @Value("${ai.groq.api-key}")
    private String apiKey;

    @Value("${ai.groq.base-url}")
    private String baseUrl;

    @Value("${ai.groq.model}")
    private String defaultModel;

    @Value("${ai.groq.temperature}")
    private Double defaultTemperature;

    @Value("${ai.groq.max-tokens}")
    private Integer defaultMaxTokens;

    // Configurações de retry MELHORADAS
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 65000; // 65 segundos (mais conservador)

    public GroqAIProvider() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public AIResponse chat(AIRequest request) {
        // Calcular tamanho do request e aguardar se for grande
        int estimatedTokens = estimateRequestTokens(request);
        log.info("📊 Request estimated tokens: {}", estimatedTokens);

        if (estimatedTokens > 3000) {
            log.warn("⚠️ Large request detected, waiting 5s before sending...");
            try {
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        int attempt = 0;

        while (attempt < MAX_RETRIES) {
            try {
                return doChat(request);
            } catch (HttpClientErrorException e) {
                if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS ||
                        e.getStatusCode() == HttpStatus.PAYLOAD_TOO_LARGE ||
                        e.getStatusCode().value() == 413) {

                    attempt++;
                    long waitTime = RETRY_DELAY_MS * attempt; // 65s, 130s, 195s

                    log.warn("Rate limit atingido (tentativa {}/{}). Aguardando {} segundos...",
                            attempt, MAX_RETRIES, waitTime / 1000);

                    if (attempt < MAX_RETRIES) {
                        try {
                            Thread.sleep(waitTime);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    } else {
                        throw new RuntimeException("Limite de requisições atingido. Aguarde um momento e tente novamente.");
                    }
                } else {
                    log.error("Erro ao chamar Groq API: {}", e.getMessage());
                    throw new RuntimeException("Falha na comunicação com o provedor de IA: " + e.getMessage());
                }
            } catch (Exception e) {
                log.error("Erro ao chamar Groq API", e);
                throw new RuntimeException("Falha na comunicação com o provedor de IA: " + e.getMessage());
            }
        }

        throw new RuntimeException("Não foi possível obter resposta após " + MAX_RETRIES + " tentativas.");
    }

    private int estimateRequestTokens(AIRequest request) {
        if (request.getMessages() == null) return 0;
        int totalChars = request.getMessages().stream()
                .mapToInt(m -> m.getContent() != null ? m.getContent().length() : 0)
                .sum();
        return totalChars / 4;
    }

    private AIResponse doChat(AIRequest request) {
        String url = baseUrl + "/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", request.getModel() != null ? request.getModel() : defaultModel);
        requestBody.put("messages", convertMessages(request.getMessages()));
        requestBody.put("temperature", request.getTemperature() != null ? request.getTemperature() : defaultTemperature);
        requestBody.put("max_tokens", request.getMaxTokens() != null ? request.getMaxTokens() : defaultMaxTokens);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        log.debug("Chamando Groq API: {} com modelo: {}", url, requestBody.get("model"));

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
        Map<String, Object> responseBody = response.getBody();

        if (responseBody != null) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");

            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> firstChoice = choices.get(0);
                Map<String, Object> message = (Map<String, Object>) firstChoice.get("message");

                Object contentObj = message.get("content");
                String content = extractContent(contentObj);

                Map<String, Object> usage = (Map<String, Object>) responseBody.get("usage");

                int promptTokens = usage != null ? (Integer) usage.get("prompt_tokens") : 0;
                int completionTokens = usage != null ? (Integer) usage.get("completion_tokens") : 0;
                int totalTokens = usage != null ? (Integer) usage.get("total_tokens") : 0;

                return AIResponse.builder()
                        .content(content)
                        .promptTokens(promptTokens)
                        .completionTokens(completionTokens)
                        .totalTokens(totalTokens)
                        .model(request.getModel() != null ? request.getModel() : defaultModel)
                        .build();
            }
        }

        throw new RuntimeException("Resposta inesperada da API do Groq");
    }

    private String extractContent(Object contentObj) {
        if (contentObj instanceof String) {
            return (String) contentObj;
        } else if (contentObj instanceof List) {
            List<Map<String, Object>> contentList = (List<Map<String, Object>>) contentObj;
            StringBuilder sb = new StringBuilder();
            for (Map<String, Object> item : contentList) {
                if ("text".equals(item.get("type")) && item.get("text") != null) {
                    sb.append(item.get("text"));
                }
            }
            return sb.toString();
        }
        return "";
    }

    @Override
    public String getProviderName() {
        return "groq";
    }

    private List<Map<String, String>> convertMessages(List<ChatMessage> messages) {
        return messages.stream()
                .map(msg -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("role", msg.getRole());
                    map.put("content", msg.getContent());
                    return map;
                })
                .collect(Collectors.toList());
    }
}