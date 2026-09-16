package com.universalai.repository;

import com.universalai.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface ReminderRepository extends JpaRepository<Reminder, UUID> {

    List<Reminder> findByUserIdAndIsCompletedFalseOrderByReminderTimeAsc(UUID userId);

    List<Reminder> findByUserIdOrderByReminderTimeAsc(UUID userId);

    @Query("SELECT r FROM Reminder r WHERE r.user.id = :userId AND r.isCompleted = false AND r.reminderTime <= :now AND r.reminderTime >= :startWindow")
    List<Reminder> findDueReminders(
            @Param("userId") UUID userId,
            @Param("now") LocalDateTime now,
            @Param("startWindow") LocalDateTime startWindow
    );
}