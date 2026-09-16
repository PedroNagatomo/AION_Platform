package com.universalai.repository;

import com.universalai.entity.Agent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AgentRepository extends JpaRepository<Agent, UUID> {
    List<Agent> findByUserIdAndIsActiveTrueOrderByNameAsc(UUID userId);
    List<Agent> findByUserIdOrderByNameAsc(UUID userId);
}