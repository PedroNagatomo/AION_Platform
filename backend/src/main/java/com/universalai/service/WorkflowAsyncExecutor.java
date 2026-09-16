package com.universalai.service;

import com.universalai.entity.Workflow;
import com.universalai.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowAsyncExecutor {

    private final WorkflowRepository workflowRepository;
    private final WorkflowExecutorService executorService;

    /**
     * Executa um workflow de forma ASSÍNCRONA em NOVA TRANSAÇÃO
     */
    @Async("taskExecutor")
    public void executeAsync(UUID workflowId, Map<String, Object> eventData) {
        try {
            // Delay para evitar rate limit e concorrência
            Thread.sleep(1000);

            Workflow workflow = workflowRepository.findById(workflowId).orElse(null);
            if (workflow == null || !Boolean.TRUE.equals(workflow.getIsActive())) {
                log.debug("Workflow {} not found or inactive", workflowId);
                return;
            }

            log.info("🚀 [ASYNC-{}] Executing workflow: {}",
                    Thread.currentThread().getName(), workflow.getName());

            executorService.executeWorkflowInNewTransaction(workflow, eventData);

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Workflow {} interrupted", workflowId);
        } catch (Exception e) {
            log.error("Error executing workflow {}: {}", workflowId, e.getMessage(), e);
        }
    }
}