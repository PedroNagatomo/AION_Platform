package com.universalai.dto;

import com.universalai.entity.CalendarEvent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDTO {
    private UUID id;
    private String title;
    private LocalDate date;
    private LocalTime time;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CalendarEventDTO fromEntity(CalendarEvent event) {
        return CalendarEventDTO.builder()
                .id(event.getId())
                .title(event.getTitle())
                .date(event.getDate())
                .time(event.getTime())
                .description(event.getDescription())
                .createdAt(event.getCreatedAt())
                .updatedAt(event.getUpdatedAt())
                .build();
    }
}