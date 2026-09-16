package com.universalai.repository;

import com.universalai.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    List<Message> findByConversationIdOrderByCreatedAtAsc(UUID conversationId);

    List<Message> findByConversationIdOrderByCreatedAtDesc(UUID conversationId);

    @Query("SELECT m FROM Message m WHERE m.id = :messageId AND m.conversation.user.id = :userId")
    Optional<Message> findByIdAndUserId(@Param("messageId") UUID messageId, @Param("userId") UUID userId);

    @Query("SELECT m FROM Message m WHERE m.id = :messageId AND m.conversation.id = :conversationId AND m.conversation.user.id = :userId")
    Optional<Message> findByIdAndConversationIdAndUserId(
            @Param("messageId") UUID messageId,
            @Param("conversationId") UUID conversationId,
            @Param("userId") UUID userId
    );

    void deleteByConversationIdAndIdGreaterThan(UUID conversationId, UUID messageId);

    @Query("SELECT m FROM Message m WHERE m.conversation.id = :conversationId AND m.role = 'USER' ORDER BY m.createdAt ASC")
    List<Message> findUserMessagesByConversationId(@Param("conversationId") UUID conversationId);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.user.id = :userId")
    Long countByUserId(@Param("userId") UUID userId);

    @Query("SELECT COALESCE(SUM(m.tokenCount), 0) FROM Message m WHERE m.conversation.user.id = :userId")
    Long sumTokensByUserId(@Param("userId") UUID userId);

    @Query("SELECT m FROM Message m WHERE m.conversation.user.id = :userId AND LOWER(m.content) LIKE LOWER(CONCAT('%', :searchTerm, '%')) ORDER BY m.createdAt DESC")
    List<Message> findByConversationUserIdAndContentContainingIgnoreCase(
            @Param("userId") UUID userId,
            @Param("searchTerm") String searchTerm
    );

    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.user.id = :userId AND m.createdAt BETWEEN :start AND :end")
    long countByUserIdAndCreatedAtBetween(
            @Param("userId") UUID userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT COALESCE(SUM(m.tokenCount), 0) FROM Message m WHERE m.conversation.user.id = :userId AND m.createdAt BETWEEN :start AND :end")
    Long sumTokensByUserIdAndDateRange(
            @Param("userId") UUID userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );
}