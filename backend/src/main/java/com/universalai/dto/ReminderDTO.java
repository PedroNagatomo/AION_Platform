package com.universalai.dto;

import com.universalai.entity.Reminder;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReminderDTO {
    private UUID id;
    private String title;
    private String description;
    private LocalDateTime reminderTime;
    private Boolean isCompleted;
    private String repeatType;
    private Integer notifyBeforeMinutes;
    private LocalDateTime createdAt;

    public static ReminderDTO fromEntity(Reminder reminder) {
        return ReminderDTO.builder()
                .id(reminder.getId())
                .title(reminder.getTitle())
                .description(reminder.getDescription())
                .reminderTime(reminder.getReminderTime())
                .isCompleted(reminder.getIsCompleted() != null ? reminder.getIsCompleted() : false)
                .repeatType(reminder.getRepeatType() != null ? reminder.getRepeatType() : "NONE")
                .notifyBeforeMinutes(reminder.getNotifyBeforeMinutes() != null ? reminder.getNotifyBeforeMinutes() : 0)
                .createdAt(reminder.getCreatedAt())
                .build();
    }
}