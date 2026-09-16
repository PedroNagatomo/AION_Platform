package com.universalai.repository;

import com.universalai.entity.Whiteboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WhiteboardRepository extends JpaRepository<Whiteboard, UUID> {
    List<Whiteboard> findByUserIdOrderByUpdatedAtDesc(UUID userId);
}