package com.universalai.repository;

import com.universalai.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    @Query("SELECT c FROM Conversation c WHERE c.user.id = :userId AND c.deletedAt IS NULL ORDER BY c.updatedAt DESC")
    List<Conversation> findAllActiveByUserId(@Param("userId") UUID userId);

    @Query("SELECT c FROM Conversation c WHERE c.id = :id AND c.user.id = :userId AND c.deletedAt IS NULL")
    Optional<Conversation> findActiveByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);
    @Query("SELECT c FROM Conversation c WHERE c.user.id = :userId AND c.deletedAt IS NULL ORDER BY c.updatedAt DESC")
    List<Conversation> findTop5ByUserIdOrderByUpdatedAtDesc(@Param("userId") UUID userId);
}