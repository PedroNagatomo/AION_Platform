package com.universalai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.universalai.ai.model.AIRequest;
import com.universalai.ai.model.AIResponse;
import com.universalai.ai.model.ChatMessage;
import com.universalai.ai.provider.AIProvider;
import com.universalai.dto.WorkflowDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIWorkflowGeneratorService {

    private final AIProvider aiProvider;
    private final ObjectMapper objectMapper;

    /**
     * Gera um workflow a partir de uma descrição em linguagem natural
     */
    public WorkflowDTO generateWorkflow(String userDescription, String language) {
        log.info("🤖 Generating workflow from: {}", userDescription);

        String systemPrompt = buildSystemPrompt(language);

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(ChatMessage.builder()
                .role("system")
                .content(systemPrompt)
                .build());
        messages.add(ChatMessage.builder()
                .role("user")
                .content(userDescription)
                .build());

        AIRequest request = AIRequest.builder()
                .messages(messages)
                .temperature(0.3) // Mais determinístico para JSON
                .maxTokens(2000)
                .build();

        AIResponse response = aiProvider.chat(request);

        return parseAIResponse(response.getContent(), userDescription);
    }

    private String buildSystemPrompt(String language) {
        return """
        You are an AI that converts natural language descriptions into JSON workflows.
        
        AVAILABLE TRIGGERS:
        - NOTE_CREATED: When a note is created. Data: {title, content, tags, icon}
        - NOTE_UPDATED: When a note is updated. Data: {title, content, tags}
        - CONTACT_CREATED: When a contact is created. Data: {name, phone, email, notes}
        - CONTACT_UPDATED: When a contact is updated. Data: {name, phone, email, notes}
        - REMINDER_CREATED: When a reminder is created. Data: {title, description, reminderTime}
        - EVENT_CREATED: When a calendar event is created. Data: {title, date, time, description}
        - CONVERSATION_ENDED: When a conversation ends. Data: {title, messageCount, transcript, fullContent}
        - FILE_UPLOADED: When a file is uploaded. Data: {fileName, fileType, fileSize, folder}
        - SPREADSHEET_CREATED: When a spreadsheet is created. Data: {name}
        - SPREADSHEET_UPDATED: When a spreadsheet is updated. Data: {name}
        - SCHEDULE: Cron-based schedule. Config: {cron: "0 9 * * *"} or {hour: 9, minute: 0}
        - MANUAL: Manual trigger
        
        AVAILABLE ACTIONS:
        - CREATE_NOTE: config: {title, content} - Variables: {{fieldName}}
        - CREATE_REMINDER: config: {title, description, minutesFromNow, repeatType}
        - CREATE_EVENT: config: {title, description, daysFromNow}
        - SEND_NOTIFICATION: config: {title, message}
        - SEND_EMAIL: config: {to, subject, body}
        - AI_PROMPT: config: {prompt, saveTo, model} 
          * This action calls AI to process the data and saves the result
          * Special variables available: {{transcript}}, {{fullContent}}, {{title}}
          * Example: {"type": "AI_PROMPT", "config": {"prompt": "Analyze this conversation:\\n\\n{{transcript}}\\n\\nCreate a detailed summary with: main topics, decisions made, action items, and key insights.", "saveTo": "note"}}
        - WEBHOOK: config: {url}
        
        AVAILABLE CONDITION OPERATORS:
        EQUALS, NOT_EQUALS, CONTAINS, NOT_CONTAINS, STARTS_WITH, ENDS_WITH, 
        GREATER_THAN, LESS_THAN, IS_EMPTY, IS_NOT_EMPTY
        
        IMPORTANT FOR CONVERSATION_ENDED:
        When user wants to "save everything", "create detailed note", "preserve conversation",
        use AI_PROMPT with {{transcript}} variable. Example:
        {
          "triggerType": "CONVERSATION_ENDED",
          "conditions": [],
          "actions": [{
            "type": "AI_PROMPT",
            "config": {
              "prompt": "Here is a complete conversation transcript:\\n\\n{{transcript}}\\n\\nCreate a comprehensive and detailed note with ALL information from this conversation. Include: all topics discussed, questions asked, answers given, examples, code snippets, decisions, and action items. Do not summarize - preserve the FULL content and context.",
              "saveTo": "note"
            }
          }]
        }
        
        Return ONLY a valid JSON object with this structure:
        {
          "name": "Short descriptive name",
          "description": "Brief description",
          "icon": "single emoji",
          "triggerType": "TRIGGER_TYPE",
          "triggerConfig": "{}",
          "conditions": [],
          "actions": [{"type": "ACTION_TYPE", "config": {}}]
        }
        
        Respond in %s
        """.formatted(language != null && language.equals("pt-BR") ? "Portuguese" : "English");
    }

    private WorkflowDTO parseAIResponse(String aiResponse, String originalDescription) {
        try {
            // Limpar resposta (remover possíveis markdown blocks)
            String cleaned = aiResponse.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```(?:json)?\\s*", "");
                cleaned = cleaned.replaceAll("\\s*```$", "");
            }

            log.debug("Parsing AI response: {}", cleaned);

            JsonNode node = objectMapper.readTree(cleaned);

            WorkflowDTO dto = WorkflowDTO.builder()
                    .name(node.has("name") ? node.get("name").asText() : "AI Generated Workflow")
                    .description(node.has("description") ? node.get("description").asText() : originalDescription)
                    .icon(node.has("icon") ? node.get("icon").asText() : "🤖")
                    .triggerType(node.has("triggerType") ? node.get("triggerType").asText() : "MANUAL")
                    .triggerConfig(node.has("triggerConfig") ? node.get("triggerConfig").asText() : "{}")
                    .conditions(node.has("conditions") ? node.get("conditions").toString() : "[]")
                    .actions(node.has("actions") ? node.get("actions").toString() : "[]")
                    .isActive(true)
                    .build();

            log.info("✅ Generated workflow: {} ({})", dto.getName(), dto.getTriggerType());
            return dto;

        } catch (Exception e) {
            log.error("Error parsing AI response: {}", e.getMessage());
            log.error("Raw response: {}", aiResponse);

            // Fallback: workflow básico
            return WorkflowDTO.builder()
                    .name("Generated Workflow")
                    .description(originalDescription)
                    .icon("🤖")
                    .triggerType("MANUAL")
                    .conditions("[]")
                    .actions("[{\"type\":\"SEND_NOTIFICATION\",\"config\":{\"title\":\"Workflow\",\"message\":\"Triggered\"}}]")
                    .isActive(false)
                    .build();
        }
    }
}