package com.universalai.repository;

import com.universalai.entity.WorkflowExecution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowExecutionRepository extends JpaRepository<WorkflowExecution, UUID> {
    List<WorkflowExecution> findByWorkflowIdOrderByExecutedAtDesc(UUID workflowId);
    List<WorkflowExecution> findTop50ByWorkflowUserIdOrderByExecutedAtDesc(UUID userId);
}