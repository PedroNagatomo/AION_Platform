package com.universalai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.universalai.entity.Integration;
import com.universalai.entity.User;
import com.universalai.repository.IntegrationRepository;
import com.universalai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntegrationService {

    private final IntegrationRepository integrationRepository;
    private final UserRepository userRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    @Value("${github.oauth.client-id:}")
    private String githubClientId;

    @Value("${github.oauth.client-secret:}")
    private String githubClientSecret;

    @Value("${github.oauth.redirect-uri:http://localhost:5173/oauth/github/callback}")
    private String githubRedirectUri;

    // Notion OAuth configuration
    @Value("${notion.oauth.client-id:}")
    private String notionClientId;

    @Value("${notion.oauth.client-secret:}")
    private String notionClientSecret;

    @Value("${notion.oauth.redirect-uri:http://localhost:5173/oauth/notion/callback}")
    private String notionRedirectUri;

    // ============ CONEXÃO BÁSICA ============

    @Transactional
    public Integration connectIntegration(UUID userId, String provider, String accessToken, String refreshToken, Map<String, Object> metadata) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Integration integration = integrationRepository.findByUserIdAndProvider(userId, provider)
                .orElse(Integration.builder()
                        .user(user)
                        .provider(provider)
                        .build());

        integration.setAccessToken(accessToken);
        integration.setRefreshToken(refreshToken);
        integration.setTokenExpiresAt(LocalDateTime.now().plusHours(1));
        integration.setIsConnected(true);

        try {
            if (metadata != null) {
                integration.setMetadata(objectMapper.writeValueAsString(metadata));
            }
        } catch (Exception e) {
            log.error("Error serializing metadata", e);
        }

        return integrationRepository.save(integration);
    }

    @Transactional
    public void disconnectIntegration(UUID userId, String provider) {
        Integration integration = integrationRepository.findByUserIdAndProvider(userId, provider)
                .orElseThrow(() -> new RuntimeException("Integration not found"));

        integration.setIsConnected(false);
        integration.setAccessToken(null);
        integration.setRefreshToken(null);
        integrationRepository.save(integration);
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserIntegrations(UUID userId) {
        List<Integration> integrations = integrationRepository.findByUserIdOrderByProviderAsc(userId);
        Map<String, Integration> integrationMap = integrations.stream()
                .collect(Collectors.toMap(Integration::getProvider, i -> i));

        String[] providers = {"google_calendar", "google_drive", "notion", "github", "trello", "slack"};

        List<Map<String, Object>> result = new ArrayList<>();
        for (String provider : providers) {
            Integration integration = integrationMap.get(provider);
            Map<String, Object> info = new HashMap<>();
            info.put("provider", provider);
            info.put("connected", integration != null && Boolean.TRUE.equals(integration.getIsConnected()));
            info.put("connectedAt", integration != null ? integration.getCreatedAt() : null);

            // Extrair metadados se existirem
            if (integration != null && integration.getMetadata() != null) {
                try {
                    JsonNode metadata = objectMapper.readTree(integration.getMetadata());
                    info.put("metadata", metadata);
                } catch (Exception e) {
                    // Ignorar
                }
            }

            result.add(info);
        }

        return result;
    }

    // ============ NOTION OAUTH ============

    /**
     * Gera a URL de autorização OAuth do Notion
     */
    public String getNotionOAuthUrl() {
        if (notionClientId == null || notionClientId.isEmpty()) {
            throw new RuntimeException("Notion OAuth Client ID not configured");
        }

        return "https://api.notion.com/v1/oauth/authorize" +
                "?client_id=" + notionClientId +
                "&redirect_uri=" + java.net.URLEncoder.encode(notionRedirectUri, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&owner=user";
    }

    /**
     * Troca o código OAuth por token de acesso
     */
    @Transactional
    public Map<String, Object> handleNotionOAuthCallback(UUID userId, String code) {
        try {
            log.info("Handling Notion OAuth callback for user: {}", userId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBasicAuth(notionClientId, notionClientSecret);

            Map<String, String> body = new HashMap<>();
            body.put("code", code);
            body.put("redirect_uri", notionRedirectUri);
            body.put("grant_type", "authorization_code");

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

            log.debug("Exchanging code for token...");
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.notion.com/v1/oauth/token",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            log.debug("Token response received: {}", jsonResponse);

            String accessToken = jsonResponse.get("access_token").asText();

            // Extrair informações do workspace
            String workspaceId = jsonResponse.has("workspace_id") ? jsonResponse.get("workspace_id").asText() : "";
            String workspaceName = jsonResponse.has("workspace_name") ? jsonResponse.get("workspace_name").asText() : "";
            String workspaceIcon = jsonResponse.has("workspace_icon") ? jsonResponse.get("workspace_icon").asText() : "";
            String botId = jsonResponse.has("bot_id") ? jsonResponse.get("bot_id").asText() : "";

            // Salvar metadados
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("workspaceId", workspaceId);
            metadata.put("workspaceName", workspaceName);
            metadata.put("workspaceIcon", workspaceIcon);
            metadata.put("botId", botId);

            // Conectar integração
            connectIntegration(userId, "notion", accessToken, null, metadata);

            log.info("Notion connected successfully for user: {}", userId);

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("provider", "notion");
            result.put("workspaceName", workspaceName);
            result.put("workspaceIcon", workspaceIcon);
            result.put("message", "Notion connected successfully");
            return result;

        } catch (Exception e) {
            log.error("Error handling Notion OAuth callback: {}", e.getMessage(), e);
            throw new RuntimeException("Error connecting Notion: " + e.getMessage());
        }
    }

    /**
     * Verifica se o usuário já está conectado ao Notion
     */
    public boolean isNotionConnected(UUID userId) {
        Integration integration = integrationRepository.findByUserIdAndProvider(userId, "notion")
                .orElse(null);
        return integration != null && Boolean.TRUE.equals(integration.getIsConnected());
    }

    /**
     * Obtém o token do Notion do usuário
     */
    private Integration getConnectedIntegration(UUID userId, String provider) {
        Integration integration = integrationRepository.findByUserIdAndProvider(userId, provider)
                .orElseThrow(() -> new RuntimeException(provider + " integration not connected"));

        if (!Boolean.TRUE.equals(integration.getIsConnected()) || integration.getAccessToken() == null) {
            throw new RuntimeException(provider + " integration is not connected");
        }

        return integration;
    }

    /**
     * Testa a conexão com o Notion
     */
    public Map<String, Object> testNotionConnection(UUID userId) {
        Integration integration = getConnectedIntegration(userId, "notion");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(integration.getAccessToken());
            headers.set("Notion-Version", "2022-06-28");
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.notion.com/v1/users/me", HttpMethod.GET, entity, String.class
            );

            JsonNode userData = objectMapper.readTree(response.getBody());

            Map<String, Object> result = new HashMap<>();
            result.put("id", userData.get("id").asText());
            result.put("name", userData.has("name") && !userData.get("name").isNull() ? userData.get("name").asText() : "Notion User");
            result.put("type", userData.has("type") ? userData.get("type").asText() : "person");
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Error testing Notion connection: " + e.getMessage());
        }
    }

    /**
     * Busca páginas do Notion
     */
    public List<Map<String, Object>> searchNotionPages(UUID userId, String query) {
        Integration integration = getConnectedIntegration(userId, "notion");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(integration.getAccessToken());
            headers.set("Notion-Version", "2022-06-28");
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("query", query != null ? query : "");
            body.put("page_size", 20);
            body.put("filter", Map.of("property", "object", "value", "page"));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.notion.com/v1/search", HttpMethod.POST, entity, String.class
            );

            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            JsonNode results = jsonResponse.get("results");

            List<Map<String, Object>> pages = new ArrayList<>();
            if (results != null && results.isArray()) {
                for (JsonNode page : results) {
                    Map<String, Object> pageInfo = new HashMap<>();
                    pageInfo.put("id", page.get("id").asText());

                    String title = "Untitled";
                    JsonNode properties = page.get("properties");
                    if (properties != null) {
                        JsonNode titleProp = properties.get("title");
                        if (titleProp != null && titleProp.has("title") && titleProp.get("title").isArray() && titleProp.get("title").size() > 0) {
                            title = titleProp.get("title").get(0).get("plain_text").asText();
                        }
                    }

                    pageInfo.put("title", title);
                    pageInfo.put("url", page.has("url") ? page.get("url").asText() : "");

                    if (page.has("icon") && !page.get("icon").isNull()) {
                        JsonNode icon = page.get("icon");
                        if (icon.has("emoji")) {
                            pageInfo.put("icon", icon.get("emoji").asText());
                        } else {
                            pageInfo.put("icon", "📄");
                        }
                    } else {
                        pageInfo.put("icon", "📄");
                    }

                    pages.add(pageInfo);
                }
            }

            return pages;
        } catch (Exception e) {
            log.error("Error searching Notion pages: {}", e.getMessage());
            throw new RuntimeException("Error searching Notion pages: " + e.getMessage());
        }
    }

    /**
     * Busca bancos de dados do Notion
     */
    public List<Map<String, Object>> searchNotionDatabases(UUID userId) {
        Integration integration = getConnectedIntegration(userId, "notion");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(integration.getAccessToken());
            headers.set("Notion-Version", "2022-06-28");
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("page_size", 20);
            body.put("filter", Map.of("property", "object", "value", "database"));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.notion.com/v1/search", HttpMethod.POST, entity, String.class
            );

            JsonNode jsonResponse = objectMapper.readTree(response.getBody());
            JsonNode results = jsonResponse.get("results");

            List<Map<String, Object>> databases = new ArrayList<>();
            if (results != null && results.isArray()) {
                for (JsonNode db : results) {
                    Map<String, Object> dbInfo = new HashMap<>();
                    dbInfo.put("id", db.get("id").asText());

                    String title = "Untitled Database";
                    JsonNode titleArray = db.get("title");
                    if (titleArray != null && titleArray.isArray() && titleArray.size() > 0) {
                        title = titleArray.get(0).get("plain_text").asText();
                    }

                    dbInfo.put("title", title);
                    dbInfo.put("url", db.has("url") ? db.get("url").asText() : "");
                    dbInfo.put("icon", "🗄️");

                    databases.add(dbInfo);
                }
            }

            return databases;
        } catch (Exception e) {
            log.error("Error searching Notion databases: {}", e.getMessage());
            throw new RuntimeException("Error searching Notion databases: " + e.getMessage());
        }
    }

    /**
     * Cria uma página no Notion
     */
    public Map<String, Object> createNotionPage(UUID userId, String parentId, String title, String content) {
        Integration integration = getConnectedIntegration(userId, "notion");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(integration.getAccessToken());
            headers.set("Notion-Version", "2022-06-28");
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();

            // Parent pode ser page_id ou database_id
            if (parentId.contains("-")) {
                // Se parece um UUID de database
                body.put("parent", Map.of("database_id", parentId));
            } else {
                body.put("parent", Map.of("page_id", parentId));
            }

            Map<String, Object> properties = new HashMap<>();
            properties.put("title", Map.of(
                    "title", List.of(Map.of("text", Map.of("content", title)))
            ));
            body.put("properties", properties);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.notion.com/v1/pages", HttpMethod.POST, entity, String.class
            );

            JsonNode pageData = objectMapper.readTree(response.getBody());

            Map<String, Object> result = new HashMap<>();
            result.put("id", pageData.get("id").asText());
            result.put("url", pageData.has("url") ? pageData.get("url").asText() : "");
            result.put("title", title);
            result.put("success", true);
            return result;

        } catch (Exception e) {
            log.error("Error creating Notion page: {}", e.getMessage());
            throw new RuntimeException("Error creating Notion page: " + e.getMessage());
        }
    }

    // ============ GITHUB ============

    public Map<String, Object> testGitHubConnection(String accessToken) {
        // ... código existente do GitHub ...
        return Map.of();
    }

    /**
     * Gera a URL de autorização OAuth do GitHub
     */
    public String getGitHubOAuthUrl() {
        if (githubClientId == null || githubClientId.isEmpty()) {
            throw new RuntimeException("GitHub OAuth Client ID not configured");
        }

        return "https://github.com/login/oauth/authorize" +
                "?client_id=" + githubClientId +
                "&redirect_uri=" + java.net.URLEncoder.encode(githubRedirectUri, StandardCharsets.UTF_8) +
                "&scope=repo,user,read:org" +
                "&allow_signup=true";
    }

    /**
     * Troca o código OAuth por token de acesso do GitHub
     */
    @Transactional
    public Map<String, Object> handleGitHubOAuthCallback(UUID userId, String code) {
        try {
            log.info("Handling GitHub OAuth callback for user: {}", userId);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setAccept(List.of(MediaType.APPLICATION_JSON));

            Map<String, String> body = new HashMap<>();
            body.put("client_id", githubClientId);
            body.put("client_secret", githubClientSecret);
            body.put("code", code);

            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

            log.debug("Exchanging GitHub code for token...");
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://github.com/login/oauth/access_token",
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            String responseBody = response.getBody();
            log.debug("GitHub token response: {}", responseBody);

            String accessToken = null;
            String refreshToken = null;
            String scope = "";

            // Verificar se a resposta é JSON ou form-encoded
            if (responseBody != null && responseBody.trim().startsWith("{")) {
                // JSON response
                JsonNode jsonNode = objectMapper.readTree(responseBody);

                if (jsonNode.has("access_token")) {
                    accessToken = jsonNode.get("access_token").asText();
                }

                if (jsonNode.has("refresh_token")) {
                    refreshToken = jsonNode.get("refresh_token").asText();
                }

                if (jsonNode.has("scope")) {
                    scope = jsonNode.get("scope").asText();
                }
            } else {
                // Form-encoded response
                Map<String, String> tokenData = parseFormEncoded(responseBody);
                accessToken = tokenData.get("access_token");
                refreshToken = tokenData.get("refresh_token");
                scope = tokenData.getOrDefault("scope", "");
            }

            if (accessToken == null || accessToken.isEmpty()) {
                log.error("No access_token found in response: {}", responseBody);
                throw new RuntimeException("No access_token received from GitHub");
            }

            log.info("GitHub access token obtained successfully");

            // Buscar informações do usuário
            Map<String, Object> userData = getGitHubUserInfo(accessToken);

            // Salvar metadados
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("login", userData.get("login"));
            metadata.put("name", userData.get("name"));
            metadata.put("avatarUrl", userData.get("avatarUrl"));
            metadata.put("reposUrl", userData.get("reposUrl"));
            metadata.put("htmlUrl", userData.get("htmlUrl"));
            metadata.put("scope", scope);

            // Conectar integração (salvar refresh token também)
            connectIntegration(userId, "github", accessToken, refreshToken, metadata);

            log.info("GitHub connected successfully for user: {} (login: {})", userId, userData.get("login"));

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("provider", "github");
            result.put("login", userData.get("login"));
            result.put("name", userData.get("name"));
            result.put("avatarUrl", userData.get("avatarUrl"));
            result.put("message", "GitHub connected successfully");
            return result;

        } catch (Exception e) {
            log.error("Error handling GitHub OAuth callback: {}", e.getMessage(), e);
            throw new RuntimeException("Error connecting GitHub: " + e.getMessage());
        }
    }

    /**
     * Busca informações do usuário do GitHub
     */
    public Map<String, Object> getGitHubUserInfo(String accessToken) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.set("Accept", "application/vnd.github.v3+json");
            headers.set("X-GitHub-Api-Version", "2022-11-28");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.github.com/user", HttpMethod.GET, entity, String.class
            );

            JsonNode userData = objectMapper.readTree(response.getBody());

            Map<String, Object> result = new HashMap<>();
            result.put("login", userData.get("login").asText());
            result.put("name", userData.has("name") && !userData.get("name").isNull() ? userData.get("name").asText() : userData.get("login").asText());
            result.put("avatarUrl", userData.get("avatar_url").asText());
            result.put("reposUrl", userData.get("repos_url").asText());
            result.put("htmlUrl", userData.get("html_url").asText());
            result.put("publicRepos", userData.has("public_repos") ? userData.get("public_repos").asInt() : 0);
            result.put("followers", userData.has("followers") ? userData.get("followers").asInt() : 0);
            result.put("following", userData.has("following") ? userData.get("following").asInt() : 0);
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Error fetching GitHub user info: " + e.getMessage());
        }
    }

    /**
     * Busca repositórios do usuário
     */
    public List<Map<String, Object>> getGitHubRepositories(UUID userId) {
        Integration integration = getConnectedIntegration(userId, "github");

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(integration.getAccessToken());
            headers.set("Accept", "application/vnd.github.v3+json");

            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://api.github.com/user/repos?sort=updated&per_page=50",
                    HttpMethod.GET,
                    entity,
                    String.class
            );

            JsonNode reposArray = objectMapper.readTree(response.getBody());

            List<Map<String, Object>> repos = new ArrayList<>();
            if (reposArray.isArray()) {
                for (JsonNode repo : reposArray) {
                    Map<String, Object> repoInfo = new HashMap<>();
                    repoInfo.put("id", repo.get("id").asLong());
                    repoInfo.put("name", repo.get("name").asText());
                    repoInfo.put("fullName", repo.get("full_name").asText());
                    repoInfo.put("description", repo.has("description") && !repo.get("description").isNull() ? repo.get("description").asText() : "");
                    repoInfo.put("htmlUrl", repo.get("html_url").asText());
                    repoInfo.put("language", repo.has("language") && !repo.get("language").isNull() ? repo.get("language").asText() : "");
                    repoInfo.put("stars", repo.has("stargazers_count") ? repo.get("stargazers_count").asInt() : 0);
                    repoInfo.put("forks", repo.has("forks_count") ? repo.get("forks_count").asInt() : 0);
                    repoInfo.put("isPrivate", repo.has("private") ? repo.get("private").asBoolean() : false);
                    repoInfo.put("updatedAt", repo.has("updated_at") ? repo.get("updated_at").asText() : "");
                    repos.add(repoInfo);
                }
            }

            return repos;
        } catch (Exception e) {
            log.error("Error fetching GitHub repositories: {}", e.getMessage());
            throw new RuntimeException("Error fetching GitHub repositories: " + e.getMessage());
        }
    }

    /**
     * Parseia resposta form-encoded (para o GitHub)
     */
    private Map<String, String> parseFormEncoded(String body) {
        Map<String, String> result = new HashMap<>();
        if (body == null) return result;

        String[] pairs = body.split("&");
        for (String pair : pairs) {
            String[] keyValue = pair.split("=", 2);
            if (keyValue.length == 2) {
                result.put(
                        java.net.URLDecoder.decode(keyValue[0], StandardCharsets.UTF_8),
                        java.net.URLDecoder.decode(keyValue[1], StandardCharsets.UTF_8)
                );
            }
        }
        return result;
    }

    public boolean isConnected(UUID userId, String provider) {
        Integration integration = integrationRepository.findByUserIdAndProvider(userId, provider)
                .orElse(null);
        return integration != null && Boolean.TRUE.equals(integration.getIsConnected());
    }


}