package com.universalai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class VoiceService {

    private final RestTemplate restTemplate;

    @Value("${voice.elevenlabs.api-key:}")
    private String elevenLabsApiKey;

    @Value("${voice.elevenlabs.voice-id:21m00Tcm4TlvDq8ikWAM}")
    private String defaultVoiceId;

    @Value("${voice.elevenlabs.model:eleven_multilingual_v2}")
    private String model;

    public VoiceService() {
        this.restTemplate = new RestTemplate();
    }

    public byte[] synthesizeSpeech(String text, String language) {
        if (elevenLabsApiKey == null || elevenLabsApiKey.isEmpty()) {
            log.warn("ElevenLabs API key not configured");
            return null;
        }

        String url = "https://api.elevenlabs.io/v1/text-to-speech/" + defaultVoiceId;

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("xi-api-key", elevenLabsApiKey);
        headers.set("Accept", "audio/mpeg");

        Map<String, Object> body = new HashMap<>();
        body.put("text", text);
        body.put("model_id", model);
        body.put("voice_settings", Map.of(
                "stability", 0.5,
                "similarity_boost", 0.75,
                "style", 0.3,
                "use_speaker_boost", true
        ));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<byte[]> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, byte[].class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                log.debug("Speech synthesized: {} characters", text.length());
                return response.getBody();
            }
        } catch (Exception e) {
            log.error("Error synthesizing speech: {}", e.getMessage());
        }

        return null;
    }
}