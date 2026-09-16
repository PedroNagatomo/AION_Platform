package com.universalai.controller;

import com.universalai.service.VoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/voice")
@RequiredArgsConstructor
public class VoiceController {

    private final VoiceService voiceService;

    @PostMapping("/speak")
    public ResponseEntity<byte[]> speak(@RequestBody Map<String, String> request) {
        String text = request.get("text");
        String language = request.getOrDefault("language", "auto");

        byte[] audio = voiceService.synthesizeSpeech(text, language);

        if (audio == null) {
            return ResponseEntity.noContent().build();
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("audio/mpeg"));
        headers.setContentLength(audio.length);
        headers.setCacheControl("no-cache");

        return ResponseEntity.ok()
                .headers(headers)
                .body(audio);
    }
}