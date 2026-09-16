package com.universalai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Slf4j
public class NotificationService {

    public void sendToUser(UUID userId, String title, String message) {
        log.info("🔔 Notification for user {}: {} - {}", userId, title, message);
        // Aqui pode integrar com WebSocket, email, push notifications, etc.
    }
}