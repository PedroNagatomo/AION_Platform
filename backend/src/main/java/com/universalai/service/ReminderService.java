package com.universalai.service;

import com.universalai.dto.ReminderDTO;
import com.universalai.entity.Reminder;
import com.universalai.entity.User;
import com.universalai.repository.ReminderRepository;
import com.universalai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ReminderDTO> getUserReminders(UUID userId) {
        return reminderRepository.findByUserIdOrderByReminderTimeAsc(userId)
                .stream()
                .map(ReminderDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReminderDTO> getActiveReminders(UUID userId) {
        return reminderRepository.findByUserIdAndIsCompletedFalseOrderByReminderTimeAsc(userId)
                .stream()
                .map(ReminderDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ReminderDTO createReminder(UUID userId, ReminderDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Reminder reminder = Reminder.builder()
                .user(user)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .reminderTime(dto.getReminderTime())
                .isCompleted(false)
                .repeatType(dto.getRepeatType() != null ? dto.getRepeatType() : "NONE")
                .notifyBeforeMinutes(dto.getNotifyBeforeMinutes() != null ? dto.getNotifyBeforeMinutes() : 0)
                .build();

        return ReminderDTO.fromEntity(reminderRepository.save(reminder));
    }

    @Transactional
    public ReminderDTO updateReminder(UUID reminderId, UUID userId, ReminderDTO dto) {
        Reminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new RuntimeException("Reminder not found"));

        if (!reminder.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        if (dto.getTitle() != null) reminder.setTitle(dto.getTitle());
        if (dto.getDescription() != null) reminder.setDescription(dto.getDescription());
        if (dto.getReminderTime() != null) reminder.setReminderTime(dto.getReminderTime());
        if (dto.getIsCompleted() != null) reminder.setIsCompleted(dto.getIsCompleted());
        if (dto.getRepeatType() != null) reminder.setRepeatType(dto.getRepeatType());
        if (dto.getNotifyBeforeMinutes() != null) reminder.setNotifyBeforeMinutes(dto.getNotifyBeforeMinutes());

        return ReminderDTO.fromEntity(reminderRepository.save(reminder));
    }

    @Transactional
    public void completeReminder(UUID reminderId, UUID userId) {
        Reminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new RuntimeException("Reminder not found"));

        if (!reminder.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        reminder.setIsCompleted(true);
        reminderRepository.save(reminder);
    }

    @Transactional
    public void deleteReminder(UUID reminderId, UUID userId) {
        Reminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new RuntimeException("Reminder not found"));

        if (!reminder.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        reminderRepository.delete(reminder);
    }

    /**
     * Busca lembretes que estão devendo (para notificações)
     */
    @Transactional(readOnly = true)
    public List<ReminderDTO> getDueReminders(UUID userId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startWindow = now.minusMinutes(30);

        return reminderRepository.findDueReminders(userId, now, startWindow)
                .stream()
                .map(ReminderDTO::fromEntity)
                .collect(Collectors.toList());
    }
}