package com.universalai.repository;

import com.universalai.entity.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {
    List<CalendarEvent> findByUserIdOrderByDateAsc(UUID userId);
    List<CalendarEvent> findByUserIdAndDate(UUID userId, LocalDate date);
}