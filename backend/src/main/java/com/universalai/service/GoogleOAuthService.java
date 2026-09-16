package com.universalai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class GoogleOAuthService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${google.oauth.client-id}")
    private String clientId;

    @Value("${google.oauth.client-secret}")
    private String clientSecret;

    @Value("${google.oauth.redirect-uri}")
    private String redirectUri;

    /**
     * Gera a URL de autorização para redirecionar o usuário
     */
    public String getAuthorizationUrl(String provider, String state) {
        String scopes = "";

        if (provider.equals("google_calendar")) {
            scopes = "https://www.googleapis.com/auth/calendar";
        } else if (provider.equals("google_drive")) {
            scopes = "https://www.googleapis.com/auth/drive.readonly";
        }

        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth";
        authUrl += "?client_id=" + clientId;
        authUrl += "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8);
        authUrl += "&response_type=code";
        authUrl += "&scope=" + URLEncoder.encode(scopes, StandardCharsets.UTF_8);
        authUrl += "&access_type=offline";
        authUrl += "&prompt=consent";
        authUrl += "&state=" + URLEncoder.encode(provider + "|" + state, StandardCharsets.UTF_8);

        return authUrl;
    }

    /**
     * Troca o código de autorização por tokens
     */
    public Map<String, Object> exchangeCodeForTokens(String code) {
        try {
            String tokenUrl = "https://oauth2.googleapis.com/token";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String body = "code=" + code +
                    "&client_id=" + clientId +
                    "&client_secret=" + clientSecret +
                    "&redirect_uri=" + redirectUri +
                    "&grant_type=authorization_code";

            HttpEntity<String> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, entity, String.class);

            JsonNode jsonResponse = objectMapper.readTree(response.getBody());

            Map<String, Object> tokens = new HashMap<>();
            tokens.put("accessToken", jsonResponse.get("access_token").asText());
            tokens.put("refreshToken", jsonResponse.has("refresh_token") ? jsonResponse.get("refresh_token").asText() : null);
            tokens.put("expiresIn", jsonResponse.has("expires_in") ? jsonResponse.get("expires_in").asLong() : null);

            return tokens;
        } catch (Exception e) {
            log.error("Error exchanging code for tokens: {}", e.getMessage());
            throw new RuntimeException("Error exchanging code: " + e.getMessage());
        }
    }

    /**
     * Renova o access token usando refresh token
     */
    public String refreshAccessToken(String refreshToken) {
        try {
            String tokenUrl = "https://oauth2.googleapis.com/token";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            String body = "client_id=" + clientId +
                    "&client_secret=" + clientSecret +
                    "&refresh_token=" + refreshToken +
                    "&grant_type=refresh_token";

            HttpEntity<String> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(tokenUrl, entity, String.class);

            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            return jsonResponse.get("access_token").asText();
        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage());
            return null;
        }
    }
}