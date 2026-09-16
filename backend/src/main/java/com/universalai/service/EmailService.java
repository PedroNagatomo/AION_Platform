package com.universalai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    public void sendEmail(String to, String subject, String body) {
        log.info("📧 Email would be sent to: {} - {}", to, subject);
        // Implementar com JavaMailSender se configurado
    }
}