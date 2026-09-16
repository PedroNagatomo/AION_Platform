package com.universalai.repository;

import com.universalai.entity.MemoryEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MemoryEntryRepository extends JpaRepository<MemoryEntry, UUID> {

    List<MemoryEntry> findByUserIdOrderByCreatedAtDesc(UUID userId);

    // NOVO: query específica por sourceId (evita lock em "users")
    List<MemoryEntry> findBySourceId(UUID sourceId);

    @Query("SELECT COUNT(m) FROM MemoryEntry m WHERE m.user.id = :userId")
    long countByUserId(@Param("userId") UUID userId);

    @Query("SELECT m FROM MemoryEntry m WHERE m.user.id = :userId AND (LOWER(m.topic) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.content) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.keywords) LIKE LOWER(CONCAT('%', :query, '%'))) ORDER BY m.importance DESC, m.createdAt DESC")
    List<MemoryEntry> searchMemories(@Param("userId") UUID userId, @Param("query") String query);

    @Query("SELECT m FROM MemoryEntry m WHERE m.user.id = :userId AND m.lastAccessedAt IS NOT NULL ORDER BY m.lastAccessedAt DESC")
    List<MemoryEntry> findRecentlyAccessed(@Param("userId") UUID userId);
}