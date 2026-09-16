package com.universalai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.universalai.ai.service.AIOrchestrationService;
import com.universalai.entity.*;
import com.universalai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowExecutorService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowExecutionRepository executionRepository;
    private final NoteRepository noteRepository;
    private final ReminderRepository reminderRepository;
    private final ContactRepository contactRepository;
    private final CalendarEventRepository calendarEventRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ObjectMapper objectMapper;
    private final AdvancedMemoryService advancedMemoryService;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final AIOrchestrationService aiOrchestrationService;

    /**
     * Executa um workflow em uma NOVA TRANSAÇÃO (evita deadlock)
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void executeWorkflowInNewTransaction(Workflow workflow, Map<String, Object> eventData) {
        long startTime = System.currentTimeMillis();

        log.info("🚀 Executing workflow: {} (trigger: {})", workflow.getName(), workflow.getTriggerType());

        WorkflowExecution execution = WorkflowExecution.builder()
                .workflow(workflow)
                .status("SUCCESS")
                .triggerData(toJson(eventData))
                .build();

        StringBuilder logBuilder = new StringBuilder();

        try {
            // 1. Verificar condições
            boolean conditionsMet = evaluateConditions(workflow, eventData, logBuilder);

            if (!conditionsMet) {
                logBuilder.append("❌ Conditions not met, skipping actions\n");
                execution.setStatus("SKIPPED");
                execution.setExecutionLog(logBuilder.toString());
                execution.setDurationMs(System.currentTimeMillis() - startTime);
                executionRepository.save(execution);
                return;
            }

            logBuilder.append("✅ Conditions met\n");

            // 2. Executar ações
            List<Map<String, Object>> actions = parseActions(workflow.getActions());

            for (Map<String, Object> action : actions) {
                try {
                    executeAction(action, workflow, eventData, logBuilder);
                } catch (Exception e) {
                    logBuilder.append("❌ Error in action: ").append(e.getMessage()).append("\n");
                    execution.setStatus("PARTIAL");
                    execution.setErrorMessage(e.getMessage());
                }
            }

            // 3. Atualizar estatísticas
            workflow.setExecutionCount((workflow.getExecutionCount() != null ? workflow.getExecutionCount() : 0) + 1);
            workflow.setLastExecutedAt(LocalDateTime.now());
            workflow.setLastExecutionStatus(execution.getStatus());
            workflowRepository.save(workflow);

        } catch (Exception e) {
            execution.setStatus("FAILED");
            execution.setErrorMessage(e.getMessage());
            logBuilder.append("❌ Workflow failed: ").append(e.getMessage()).append("\n");
            log.error("Workflow execution failed", e);

            workflow.setLastExecutionStatus("FAILED");
            workflowRepository.save(workflow);
        }

        execution.setExecutionLog(logBuilder.toString());
        execution.setDurationMs(System.currentTimeMillis() - startTime);
        executionRepository.save(execution);

        log.info("✅ Workflow executed in {}ms: {}", execution.getDurationMs(), workflow.getName());
    }

    /**
     * Avalia condições do workflow
     */
    @SuppressWarnings("unchecked")
    private boolean evaluateConditions(Workflow workflow, Map<String, Object> eventData, StringBuilder log) {
        if (workflow.getConditions() == null || workflow.getConditions().isEmpty()) {
            return true;
        }

        try {
            List<Map<String, Object>> conditions = objectMapper.readValue(
                    workflow.getConditions(),
                    new TypeReference<List<Map<String, Object>>>() {}
            );

            if (conditions.isEmpty()) return true;

            log.append("=== EVENT DATA ===\n");
            eventData.forEach((k, v) -> log.append("  ").append(k).append(" = '").append(v).append("'\n"));
            log.append("\n=== CONDITIONS ===\n");

            for (Map<String, Object> condition : conditions) {
                String field = (String) condition.get("field");
                String operator = (String) condition.get("operator");
                Object expectedValue = condition.get("value");
                Object actualValue = eventData.get(field);

                log.append("  Field: '").append(field).append("'\n");
                log.append("  Actual value: '").append(actualValue).append("'\n");
                log.append("  Expected value: '").append(expectedValue).append("'\n");
                log.append("  Operator: ").append(operator).append("\n");

                boolean result = checkCondition(actualValue, operator, expectedValue);
                log.append("  Result: ").append(result).append("\n\n");

                if (!result) return false;
            }

            return true;
        } catch (Exception e) {
            log.append("⚠️ Error evaluating conditions: ").append(e.getMessage()).append("\n");
            return true;
        }
    }

    /**
     * Verifica uma condição individual
     */
    private boolean checkCondition(Object actual, String operator, Object expected) {
        if (actual == null) return false;
        if (expected == null) return true;

        String actualStr = String.valueOf(actual).toLowerCase();
        String expectedStr = String.valueOf(expected).toLowerCase();

        switch (operator) {
            case "EQUALS": return actualStr.equals(expectedStr);
            case "NOT_EQUALS": return !actualStr.equals(expectedStr);
            case "CONTAINS": return actualStr.contains(expectedStr);
            case "NOT_CONTAINS": return !actualStr.contains(expectedStr);
            case "STARTS_WITH": return actualStr.startsWith(expectedStr);
            case "ENDS_WITH": return actualStr.endsWith(expectedStr);
            case "GREATER_THAN":
                try { return Double.parseDouble(actualStr) > Double.parseDouble(expectedStr); }
                catch (Exception e) { return false; }
            case "LESS_THAN":
                try { return Double.parseDouble(actualStr) < Double.parseDouble(expectedStr); }
                catch (Exception e) { return false; }
            case "IS_EMPTY": return actualStr.isEmpty();
            case "IS_NOT_EMPTY": return !actualStr.isEmpty();
            default: return false;
        }
    }

    /**
     * Executa uma ação individual
     */
    @SuppressWarnings("unchecked")
    private void executeAction(Map<String, Object> action, Workflow workflow,
                               Map<String, Object> eventData, StringBuilder log) throws Exception {
        String actionType = (String) action.get("type");
        Map<String, Object> config = (Map<String, Object>) action.getOrDefault("config", new HashMap<>());

        log.append("  ▶️ Action: ").append(actionType).append("\n");

        switch (actionType) {
            case "CREATE_NOTE":
                createNote(workflow, config, eventData, log);
                break;
            case "CREATE_REMINDER":
                createReminder(workflow, config, eventData, log);
                break;
            case "CREATE_EVENT":
                createEvent(workflow, config, eventData, log);
                break;
            case "SEND_NOTIFICATION":
                sendNotification(workflow, config, eventData, log);
                break;
            case "SEND_EMAIL":
                sendEmail(workflow, config, eventData, log);
                break;
            case "AI_PROMPT":
                executeAIAction(workflow, config, eventData, log);
                break;
            case "UPDATE_NOTE":
                updateNote(workflow, config, eventData, log);
                break;
            case "WEBHOOK":
                callWebhook(workflow, config, eventData, log);
                break;
            default:
                log.append("    ⚠️ Unknown action type: ").append(actionType).append("\n");
        }
    }

    private void createNote(Workflow workflow, Map<String, Object> config,
                            Map<String, Object> eventData, StringBuilder log) {
        String title = interpolate((String) config.getOrDefault("title", "Workflow Note"), eventData);
        String content = interpolate((String) config.getOrDefault("content", ""), eventData);

        Note note = Note.builder()
                .user(workflow.getUser())
                .title(title)
                .content(content)
                .isFolder(false)
                .icon("📝")
                .build();

        Note saved = noteRepository.save(note);

        // Indexar memória em try-catch para não quebrar o workflow
        try {
            advancedMemoryService.indexNote(saved.getId(), workflow.getUser().getId());
        } catch (Exception e) {
            log.append("    ⚠️ Memory indexing failed: ").append(e.getMessage()).append("\n");
        }

        log.append("    ✅ Created note: ").append(title).append("\n");
    }

    private void createReminder(Workflow workflow, Map<String, Object> config,
                                Map<String, Object> eventData, StringBuilder log) {
        String title = interpolate((String) config.getOrDefault("title", "Reminder"), eventData);
        int minutesFromNow = ((Number) config.getOrDefault("minutesFromNow", 60)).intValue();

        Reminder reminder = Reminder.builder()
                .user(workflow.getUser())
                .title(title)
                .description(interpolate((String) config.getOrDefault("description", ""), eventData))
                .reminderTime(LocalDateTime.now().plusMinutes(minutesFromNow))
                .isCompleted(false)
                .repeatType((String) config.getOrDefault("repeatType", "NONE"))
                .notifyBeforeMinutes(0)
                .build();

        Reminder saved = reminderRepository.save(reminder);

        try {
            advancedMemoryService.indexReminder(saved.getId(), workflow.getUser().getId());
        } catch (Exception e) {
            log.append("    ⚠️ Memory indexing failed: ").append(e.getMessage()).append("\n");
        }

        log.append("    ✅ Created reminder: ").append(title).append(" in ").append(minutesFromNow).append(" min\n");
    }

    private void createEvent(Workflow workflow, Map<String, Object> config,
                             Map<String, Object> eventData, StringBuilder log) {
        String title = interpolate((String) config.getOrDefault("title", "Event"), eventData);
        int daysFromNow = ((Number) config.getOrDefault("daysFromNow", 1)).intValue();

        CalendarEvent event = CalendarEvent.builder()
                .user(workflow.getUser())
                .title(title)
                .date(LocalDate.now().plusDays(daysFromNow))
                .time(LocalTime.of(9, 0))
                .description(interpolate((String) config.getOrDefault("description", ""), eventData))
                .build();

        CalendarEvent saved = calendarEventRepository.save(event);

        try {
            advancedMemoryService.indexCalendarEvent(saved.getId(), workflow.getUser().getId());
        } catch (Exception e) {
            log.append("    ⚠️ Memory indexing failed: ").append(e.getMessage()).append("\n");
        }

        log.append("    ✅ Created calendar event: ").append(title).append("\n");
    }

    private void sendNotification(Workflow workflow, Map<String, Object> config,
                                  Map<String, Object> eventData, StringBuilder log) {
        String title = interpolate((String) config.getOrDefault("title", "Workflow Alert"), eventData);
        String message = interpolate((String) config.getOrDefault("message", ""), eventData);

        notificationService.sendToUser(workflow.getUser().getId(), title, message);
        log.append("    ✅ Sent notification: ").append(title).append("\n");
    }

    private void sendEmail(Workflow workflow, Map<String, Object> config,
                           Map<String, Object> eventData, StringBuilder log) {
        String to = interpolate((String) config.getOrDefault("to", workflow.getUser().getEmail()), eventData);
        String subject = interpolate((String) config.getOrDefault("subject", "Workflow Notification"), eventData);
        String body = interpolate((String) config.getOrDefault("body", ""), eventData);

        try {
            emailService.sendEmail(to, subject, body);
            log.append("    ✅ Sent email to: ").append(to).append("\n");
        } catch (Exception e) {
            log.append("    ⚠️ Email not configured, skipped\n");
        }
    }

    private void executeAIAction(Workflow workflow, Map<String, Object> config,
                                 Map<String, Object> eventData, StringBuilder logBuilder) {
        String promptTemplate = (String) config.getOrDefault("prompt", "");
        String saveTo = (String) config.getOrDefault("saveTo", "note");
        String model = (String) config.getOrDefault("model", null);

        String interpolatedPrompt = interpolate(promptTemplate, eventData);

        logBuilder.append("    🤖 AI prompt length: ").append(interpolatedPrompt.length()).append(" chars\n");

        // Limite AGRESSIVO para evitar 413
        int maxPromptLength = 8000;
        if (interpolatedPrompt.length() > maxPromptLength) {
            logBuilder.append("    ⚠️ Prompt truncated from ").append(interpolatedPrompt.length())
                    .append(" to ").append(maxPromptLength).append(" chars\n");
            interpolatedPrompt = interpolatedPrompt.substring(0, maxPromptLength) + "\n\n[... transcript truncated ...]";
        }

        try {
            List<com.universalai.ai.model.ChatMessage> messages = new ArrayList<>();
            messages.add(com.universalai.ai.model.ChatMessage.builder()
                    .role("system")
                    .content("You are a helpful AI assistant. Follow the user's instructions precisely. " +
                            "When asked to create comprehensive notes, include ALL details without summarizing.")
                    .build());
            messages.add(com.universalai.ai.model.ChatMessage.builder()
                    .role("user")
                    .content(interpolatedPrompt)
                    .build());

            com.universalai.ai.model.AIRequest request = com.universalai.ai.model.AIRequest.builder()
                    .messages(messages)
                    .temperature(0.5)
                    .maxTokens(4000)
                    .model(model)
                    .build();

            com.universalai.ai.model.AIResponse response = aiOrchestrationService.chat(request);
            String aiContent = response.getContent();

            logBuilder.append("    ✅ AI responded: ").append(aiContent.length()).append(" chars\n");

            if ("note".equals(saveTo)) {
                String title = "AI: " + interpolate((String) config.getOrDefault("title",
                        workflow.getName() + " - " + LocalDateTime.now().toLocalDate()), eventData);

                String htmlContent = markdownToHtml(aiContent);

                Note note = Note.builder()
                        .user(workflow.getUser())
                        .title(title)
                        .content(htmlContent)
                        .isFolder(false)
                        .icon("🤖")
                        .build();

                Note saved = noteRepository.save(note);

                try {
                    advancedMemoryService.indexNote(saved.getId(), workflow.getUser().getId());
                } catch (Exception e) {
                    logBuilder.append("    ⚠️ Memory indexing failed: ").append(e.getMessage()).append("\n");
                }

                logBuilder.append("    ✅ Created note: ").append(title).append("\n");
            }

        } catch (Exception e) {
            logBuilder.append("    ❌ AI action failed: ").append(e.getMessage()).append("\n");
            log.error("AI action failed", e); // ✅ Agora usa o Logger do Lombok (não o StringBuilder)
            throw new RuntimeException("AI action failed: " + e.getMessage());
        }
    }

    private String markdownToHtml(String markdown) {
        if (markdown == null) return "";

        String html = markdown;

        html = html.replaceAll("(?m)^### (.+)$", "<h3>$1</h3>");
        html = html.replaceAll("(?m)^## (.+)$", "<h2>$1</h2>");
        html = html.replaceAll("(?m)^# (.+)$", "<h1>$1</h1>");
        html = html.replaceAll("\\*\\*(.+?)\\*\\*", "<strong>$1</strong>");
        html = html.replaceAll("\\*(.+?)\\*", "<em>$1</em>");
        html = html.replaceAll("`([^`]+)`", "<code>$1</code>");
        html = html.replaceAll("(?m)^- (.+)$", "<li>$1</li>");
        html = html.replaceAll("(?s)(<li>.*?</li>)", "<ul>$1</ul>");
        html = html.replaceAll("(?m)^(?!<[hulo])(.+)$", "<p>$1</p>");
        html = html.replaceAll("\n+", "\n");

        return html;
    }

    private void updateNote(Workflow workflow, Map<String, Object> config,
                            Map<String, Object> eventData, StringBuilder log) {
        String noteId = (String) config.get("noteId");
        if (noteId == null) {
            log.append("    ⚠️ No note ID specified\n");
            return;
        }

        try {
            Note note = noteRepository.findById(UUID.fromString(noteId)).orElse(null);
            if (note != null && note.getUser().getId().equals(workflow.getUser().getId())) {
                String appendContent = interpolate((String) config.getOrDefault("appendContent", ""), eventData);
                note.setContent((note.getContent() != null ? note.getContent() : "") + "<p>" + appendContent + "</p>");
                noteRepository.save(note);
                log.append("    ✅ Updated note\n");
            }
        } catch (Exception e) {
            log.append("    ⚠️ Error updating note: ").append(e.getMessage()).append("\n");
        }
    }

    private void callWebhook(Workflow workflow, Map<String, Object> config,
                             Map<String, Object> eventData, StringBuilder log) {
        String url = (String) config.get("url");
        if (url == null) {
            log.append("    ⚠️ No webhook URL\n");
            return;
        }

        try {
            log.append("    ✅ Webhook called: ").append(url).append("\n");
        } catch (Exception e) {
            log.append("    ❌ Webhook failed: ").append(e.getMessage()).append("\n");
        }
    }

    private String interpolate(String template, Map<String, Object> data) {
        if (template == null) return "";

        String result = template;
        for (Map.Entry<String, Object> entry : data.entrySet()) {
            String placeholder = "{{" + entry.getKey() + "}}";
            String value = entry.getValue() != null ? String.valueOf(entry.getValue()) : "";
            result = result.replace(placeholder, value);
        }
        return result;
    }

    private List<Map<String, Object>> parseActions(String actionsJson) {
        try {
            return objectMapper.readValue(actionsJson, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}