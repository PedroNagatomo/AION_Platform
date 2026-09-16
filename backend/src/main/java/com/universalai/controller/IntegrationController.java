package com.universalai.controller;

import com.universalai.entity.User;
import com.universalai.repository.UserRepository;
import com.universalai.service.GoogleOAuthService;
import com.universalai.service.IntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
public class IntegrationController {

    private final IntegrationService integrationService;
    private final GoogleOAuthService googleOAuthService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getIntegrations() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(integrationService.getUserIntegrations(userId));
    }

    @PostMapping("/{provider}/connect")
    public ResponseEntity<Map<String, Object>> connectIntegration(
            @PathVariable String provider,
            @RequestBody Map<String, Object> request) {
        UUID userId = getCurrentUserId();

        String accessToken = (String) request.get("accessToken");
        String refreshToken = (String) request.get("refreshToken");

        integrationService.connectIntegration(userId, provider, accessToken, refreshToken, request);

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("success", true);
        result.put("provider", provider);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{provider}")
    public ResponseEntity<Void> disconnectIntegration(@PathVariable String provider) {
        UUID userId = getCurrentUserId();
        integrationService.disconnectIntegration(userId, provider);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/github/test")
    public ResponseEntity<Map<String, Object>> testGitHub(@RequestBody Map<String, String> request) {
        String accessToken = request.get("accessToken");
        return ResponseEntity.ok(integrationService.testGitHubConnection(accessToken));
    }

    @GetMapping("/notion/oauth-url")
    public ResponseEntity<Map<String, String>> getNotionOAuthUrl() {
        Map<String, String> response = new HashMap<>();
        response.put("url", integrationService.getNotionOAuthUrl());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/notion/oauth-callback")
    public ResponseEntity<Map<String, Object>> notionOAuthCallback(@RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        String code = request.get("code");
        return ResponseEntity.ok(integrationService.handleNotionOAuthCallback(userId, code));
    }

    @GetMapping("/notion/status")
    public ResponseEntity<Map<String, Object>> getNotionStatus() {
        UUID userId = getCurrentUserId();
        Map<String, Object> response = new HashMap<>();
        response.put("connected", integrationService.isNotionConnected(userId));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/notion/test")
    public ResponseEntity<Map<String, Object>> testNotion() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(integrationService.testNotionConnection(userId));
    }

    @GetMapping("/notion/pages")
    public ResponseEntity<List<Map<String, Object>>> searchNotionPages(
            @RequestParam(required = false) String query) {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(integrationService.searchNotionPages(userId, query));
    }

    @GetMapping("/notion/databases")
    public ResponseEntity<List<Map<String, Object>>> searchNotionDatabases() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(integrationService.searchNotionDatabases(userId));
    }

    @PostMapping("/notion/pages")
    public ResponseEntity<Map<String, Object>> createNotionPage(
            @RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        String parentId = request.get("parentId");
        String title = request.get("title");
        String content = request.get("content");
        return ResponseEntity.ok(integrationService.createNotionPage(userId, parentId, title, content));
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }

    /**
     * Inicia o fluxo OAuth - retorna URL de autorização
     */
    @GetMapping("/{provider}/oauth/start")
    public ResponseEntity<Map<String, String>> startOAuth(@PathVariable String provider) {
        UUID userId = getCurrentUserId();
        String state = userId.toString();
        String authUrl = googleOAuthService.getAuthorizationUrl(provider, state);

        Map<String, String> response = new HashMap<>();
        response.put("authUrl", authUrl);
        return ResponseEntity.ok(response);
    }

    /**
     * Callback do OAuth - recebe o code e troca por tokens
     */
    @GetMapping("/oauth/callback")
    public ResponseEntity<Void> oauthCallback(
            @RequestParam String code,
            @RequestParam String state) {

        // state = "provider|userId"
        String[] stateParts = state.split("\\|");
        String provider = stateParts[0];
        UUID userId = UUID.fromString(stateParts[1]);

        // Trocar code por tokens
        Map<String, Object> tokens = googleOAuthService.exchangeCodeForTokens(code);

        // Salvar integração
        integrationService.connectIntegration(
                userId,
                provider,
                (String) tokens.get("accessToken"),
                (String) tokens.get("refreshToken"),
                null
        );

        // Redirecionar de volta para a página de integrações
        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, "http://localhost:5173/integrations?connected=" + provider)
                .build();
    }

    // ============ GITHUB OAUTH ENDPOINTS ============

    @GetMapping("/github/oauth-url")
    public ResponseEntity<Map<String, String>> getGitHubOAuthUrl() {
        Map<String, String> response = new HashMap<>();
        response.put("url", integrationService.getGitHubOAuthUrl());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/github/oauth-callback")
    public ResponseEntity<Map<String, Object>> githubOAuthCallback(@RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        String code = request.get("code");
        return ResponseEntity.ok(integrationService.handleGitHubOAuthCallback(userId, code));
    }

    @GetMapping("/github/status")
    public ResponseEntity<Map<String, Object>> getGitHubStatus() {
        UUID userId = getCurrentUserId();
        Map<String, Object> response = new HashMap<>();
        response.put("connected", integrationService.isConnected(userId, "github"));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/github/repositories")
    public ResponseEntity<List<Map<String, Object>>> getGitHubRepositories() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(integrationService.getGitHubRepositories(userId));
    }

}
