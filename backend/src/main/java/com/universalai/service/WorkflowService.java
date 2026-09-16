package com.universalai.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.universalai.dto.WorkflowDTO;
import com.universalai.entity.*;
import com.universalai.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowExecutionRepository executionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;
    private final WorkflowAsyncExecutor asyncExecutor; // ← MUDOU

    @Transactional(readOnly = true)
    public List<WorkflowDTO> getUserWorkflows(UUID userId) {
        return workflowRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(WorkflowDTO::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public WorkflowDTO createWorkflow(UUID userId, WorkflowDTO dto) {
        User user = userRepository.findById(userId).orElseThrow();

        Workflow workflow = Workflow.builder()
                .user(user)
                .name(dto.getName())
                .description(dto.getDescription())
                .icon(dto.getIcon() != null ? dto.getIcon() : "⚡")
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .triggerType(dto.getTriggerType())
                .triggerConfig(dto.getTriggerConfig())
                .conditions(dto.getConditions())
                .actions(dto.getActions())
                .build();

        return WorkflowDTO.fromEntity(workflowRepository.save(workflow));
    }

    @Transactional
    public WorkflowDTO updateWorkflow(UUID id, UUID userId, WorkflowDTO dto) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));

        if (!workflow.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        if (dto.getName() != null) workflow.setName(dto.getName());
        if (dto.getDescription() != null) workflow.setDescription(dto.getDescription());
        if (dto.getIcon() != null) workflow.setIcon(dto.getIcon());
        if (dto.getIsActive() != null) workflow.setIsActive(dto.getIsActive());
        if (dto.getTriggerType() != null) workflow.setTriggerType(dto.getTriggerType());
        if (dto.getTriggerConfig() != null) workflow.setTriggerConfig(dto.getTriggerConfig());
        if (dto.getConditions() != null) workflow.setConditions(dto.getConditions());
        if (dto.getActions() != null) workflow.setActions(dto.getActions());

        return WorkflowDTO.fromEntity(workflowRepository.save(workflow));
    }

    @Transactional
    public void deleteWorkflow(UUID id, UUID userId) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));

        if (!workflow.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        workflowRepository.delete(workflow);
    }

    @Transactional
    public WorkflowDTO toggleWorkflow(UUID id, UUID userId) {
        Workflow workflow = workflowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Workflow not found"));

        if (!workflow.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        workflow.setIsActive(!Boolean.TRUE.equals(workflow.getIsActive()));
        return WorkflowDTO.fromEntity(workflowRepository.save(workflow));
    }

    /**
     * DISPARAR WORKFLOWS por evento
     * Apenas enfileira execução assíncrona e retorna imediatamente
     */
    public void triggerWorkflows(UUID userId, String triggerType, Map<String, Object> eventData) {
        log.info("⚡ Triggering workflows for user={} trigger={}", userId, triggerType);

        List<Workflow> workflows;
        try {
            workflows = workflowRepository.findActiveByTriggerType(userId, triggerType);
        } catch (Exception e) {
            log.error("Error fetching workflows: {}", e.getMessage());
            return;
        }

        if (workflows.isEmpty()) {
            log.debug("No active workflows for trigger: {}", triggerType);
            return;
        }

        log.info("Found {} active workflows for trigger {}", workflows.size(), triggerType);

        // Enfileirar execução assíncrona (via classe separada para @Async funcionar)
        for (Workflow workflow : workflows) {
            asyncExecutor.executeAsync(workflow.getId(), eventData);  // ← MUDOU
        }
    }

    /**
     * DISPARAR WORKFLOWS para todos os usuários (jobs agendados)
     */
    public void triggerWorkflowsForAll(String triggerType, Map<String, Object> eventData) {
        List<Workflow> workflows = workflowRepository.findAllActiveByTriggerType(triggerType);

        for (Workflow workflow : workflows) {
            try {
                Map<String, Object> userData = new HashMap<>(eventData);
                userData.put("userId", workflow.getUser().getId());
                asyncExecutor.executeAsync(workflow.getId(), userData);  // ← MUDOU
            } catch (Exception e) {
                log.error("Error queueing workflow {}: {}", workflow.getName(), e.getMessage());
            }
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getExecutions(UUID userId, int limit) {
        List<WorkflowExecution> executions = executionRepository
                .findTop50ByWorkflowUserIdOrderByExecutedAtDesc(userId);

        return executions.stream()
                .limit(limit)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", e.getId());
                    map.put("workflowId", e.getWorkflow().getId());
                    map.put("workflowName", e.getWorkflow().getName());
                    map.put("status", e.getStatus());
                    map.put("executedAt", e.getExecutedAt());
                    map.put("durationMs", e.getDurationMs());
                    map.put("errorMessage", e.getErrorMessage());
                    return map;
                })
                .collect(Collectors.toList());
    }
}