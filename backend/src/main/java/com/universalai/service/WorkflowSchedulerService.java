package com.universalai.service;

import com.universalai.entity.Workflow;
import com.universalai.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowSchedulerService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowService workflowService;

    /**
     * Verifica workflows agendados a cada minuto
     */
    @Scheduled(cron = "0 * * * * *")
    public void checkScheduledWorkflows() {
        List<Workflow> workflows = workflowRepository.findAllActiveByTriggerType("SCHEDULE");

        LocalDateTime now = LocalDateTime.now();

        for (Workflow workflow : workflows) {
            if (shouldRunNow(workflow, now)) {
                log.info("⏰ Running scheduled workflow: {}", workflow.getName());

                Map<String, Object> eventData = new HashMap<>();
                eventData.put("scheduledTime", now.toString());
                eventData.put("workflowName", workflow.getName());

                try {
                    workflowService.triggerWorkflows(
                            workflow.getUser().getId(),
                            "SCHEDULE",
                            eventData
                    );
                } catch (Exception e) {
                    log.error("Error running scheduled workflow: {}", e.getMessage());
                }
            }
        }
    }

    /**
     * Verifica eventos do calendário a cada 5 minutos
     */
    @Scheduled(cron = "0 */5 * * * *")
    public void checkUpcomingEvents() {
        // Dispara workflows do tipo EVENT_STARTING para eventos que começam em 15 minutos
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime soon = now.plusMinutes(15);

        List<Workflow> workflows = workflowRepository.findAllActiveByTriggerType("EVENT_STARTING");

        if (workflows.isEmpty()) return;

        log.debug("Checking {} workflows for upcoming events", workflows.size());
        // Implementação depende de query específica de eventos
    }

    /**
     * Verifica lembretes a cada minuto
     */
    @Scheduled(cron = "0 * * * * *")
    public void checkDueReminders() {
        List<Workflow> workflows = workflowRepository.findAllActiveByTriggerType("REMINDER_DUE");
        if (workflows.isEmpty()) return;

        // Implementar verificação de lembretes devidos
    }

    private boolean shouldRunNow(Workflow workflow, LocalDateTime now) {
        // Parse do triggerConfig para saber quando rodar
        // Exemplo: {"cron": "0 9 * * *"} ou {"hour": 9, "minute": 0, "days": [1,2,3,4,5]}

        try {
            if (workflow.getTriggerConfig() == null) return false;

            // Verificar hora/minuto específicos
            // Implementação simplificada - expandir conforme necessário
            return false; // Por enquanto não executa automaticamente
        } catch (Exception e) {
            return false;
        }
    }
}