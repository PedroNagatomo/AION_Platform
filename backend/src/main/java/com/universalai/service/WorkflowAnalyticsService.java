package com.universalai.service;

import com.universalai.entity.Workflow;
import com.universalai.entity.WorkflowExecution;
import com.universalai.repository.WorkflowExecutionRepository;
import com.universalai.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowAnalyticsService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowExecutionRepository executionRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getAnalytics(UUID userId) {
        Map<String, Object> analytics = new HashMap<>();

        List<Workflow> workflows = workflowRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<WorkflowExecution> executions = executionRepository.findTop50ByWorkflowUserIdOrderByExecutedAtDesc(userId);

        // 1. Estatísticas gerais
        long totalExecutions = workflows.stream()
                .mapToLong(w -> w.getExecutionCount() != null ? w.getExecutionCount() : 0)
                .sum();

        long successCount = executions.stream().filter(e -> "SUCCESS".equals(e.getStatus())).count();
        long failedCount = executions.stream().filter(e -> "FAILED".equals(e.getStatus())).count();
        long partialCount = executions.stream().filter(e -> "PARTIAL".equals(e.getStatus())).count();

        double successRate = executions.isEmpty() ? 100.0 :
                (successCount * 100.0) / executions.size();

        Double avgDuration = executions.stream()
                .filter(e -> e.getDurationMs() != null)
                .mapToLong(WorkflowExecution::getDurationMs)
                .average()
                .orElse(0.0);

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalWorkflows", workflows.size());
        summary.put("activeWorkflows", workflows.stream().filter(w -> Boolean.TRUE.equals(w.getIsActive())).count());
        summary.put("totalExecutions", totalExecutions);
        summary.put("successRate", Math.round(successRate * 10) / 10.0);
        summary.put("avgDurationMs", Math.round(avgDuration));
        summary.put("successCount", successCount);
        summary.put("failedCount", failedCount);
        summary.put("partialCount", partialCount);
        analytics.put("summary", summary);

        // 2. Execuções por dia (últimos 7 dias)
        analytics.put("dailyExecutions", getDailyExecutions(executions));

        // 3. Execuções por hora do dia
        analytics.put("hourlyExecutions", getHourlyExecutions(executions));

        // 4. Top workflows mais executados
        analytics.put("topWorkflows", workflows.stream()
                .sorted((a, b) -> Long.compare(
                        b.getExecutionCount() != null ? b.getExecutionCount() : 0,
                        a.getExecutionCount() != null ? a.getExecutionCount() : 0
                ))
                .limit(5)
                .map(w -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", w.getId());
                    map.put("name", w.getName());
                    map.put("icon", w.getIcon());
                    map.put("executionCount", w.getExecutionCount());
                    map.put("status", w.getIsActive() ? "active" : "paused");
                    return map;
                })
                .collect(Collectors.toList()));

        // 5. Status distribution (para gráfico pie)
        List<Map<String, Object>> statusDistribution = new ArrayList<>();
        statusDistribution.add(Map.of("name", "Success", "value", successCount, "color", "#00ff00"));
        statusDistribution.add(Map.of("name", "Failed", "value", failedCount, "color", "#ff3333"));
        statusDistribution.add(Map.of("name", "Partial", "value", partialCount, "color", "#ffaa00"));
        analytics.put("statusDistribution", statusDistribution);

        // 6. Timeline de execuções recentes
        analytics.put("recentExecutions", executions.stream()
                .limit(20)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", e.getId());
                    map.put("workflowName", e.getWorkflow().getName());
                    map.put("workflowIcon", e.getWorkflow().getIcon());
                    map.put("status", e.getStatus());
                    map.put("executedAt", e.getExecutedAt());
                    map.put("durationMs", e.getDurationMs());
                    return map;
                })
                .collect(Collectors.toList()));

        // 7. Trigger types distribution
        Map<String, Long> triggerCounts = workflows.stream()
                .collect(Collectors.groupingBy(Workflow::getTriggerType, Collectors.counting()));
        analytics.put("triggerDistribution", triggerCounts);

        return analytics;
    }

    private List<Map<String, Object>> getDailyExecutions(List<WorkflowExecution> executions) {
        List<Map<String, Object>> daily = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);

            long count = executions.stream()
                    .filter(e -> e.getExecutedAt().toLocalDate().equals(date))
                    .count();

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.format(DateTimeFormatter.ofPattern("MMM dd")));
            dayData.put("executions", count);
            daily.add(dayData);
        }

        return daily;
    }

    private List<Map<String, Object>> getHourlyExecutions(List<WorkflowExecution> executions) {
        List<Map<String, Object>> hourly = new ArrayList<>();

        for (int hour = 0; hour < 24; hour++) {
            final int h = hour;
            long count = executions.stream()
                    .filter(e -> e.getExecutedAt().getHour() == h)
                    .count();

            Map<String, Object> hourData = new HashMap<>();
            hourData.put("hour", String.format("%02d:00", hour));
            hourData.put("executions", count);
            hourly.add(hourData);
        }

        return hourly;
    }
}