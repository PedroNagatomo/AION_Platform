package com.universalai.repository;

import com.universalai.entity.Workflow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkflowRepository extends JpaRepository<Workflow, UUID> {
    List<Workflow> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Workflow> findByUserIdAndIsActiveTrue(UUID userId);

    @Query("SELECT w FROM Workflow w WHERE w.user.id = :userId AND w.isActive = true AND w.triggerType = :triggerType")
    List<Workflow> findActiveByTriggerType(@Param("userId") UUID userId, @Param("triggerType") String triggerType);

    @Query("SELECT w FROM Workflow w WHERE w.isActive = true AND w.triggerType = :triggerType")
    List<Workflow> findAllActiveByTriggerType(@Param("triggerType") String triggerType);
}