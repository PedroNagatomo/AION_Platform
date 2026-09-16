package com.universalai.repository;

import com.universalai.entity.Chart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChartRepository extends JpaRepository<Chart, UUID> {
    List<Chart> findByUserIdOrderByUpdatedAtDesc(UUID userId);
}