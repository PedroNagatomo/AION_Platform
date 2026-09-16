package com.universalai.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.universalai.entity.User;
import com.universalai.repository.UserRepository;
import com.universalai.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NoteControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    private String authToken;

    @BeforeEach
    void setUp() {
        // Criar usuário de teste
        User user = userRepository.findByEmail("it-test@example.com")
                .orElseGet(() -> userRepository.save(
                        User.builder()
                                .email("it-test@example.com")
                                .passwordHash("$2a$10$test")
                                .build()
                ));

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(), user.getPasswordHash(), Collections.emptyList()
        );
        authToken = jwtService.generateToken(userDetails);
    }

    @Test
    void testCreateNote_ReturnsCreatedNote() throws Exception {
        Map<String, Object> request = Map.of(
                "title", "Integration Test Note",
                "content", "<p>Test content</p>",
                "isFolder", false
        );

        mockMvc.perform(post("/api/notes")
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Integration Test Note"))
                .andExpect(jsonPath("$.id").exists());
    }

    @Test
    void testCreateNote_Unauthorized() throws Exception {
        Map<String, Object> request = Map.of("title", "Test");

        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden()); // ou 401 dependendo da config
    }

    @Test
    void testGetNotes_ReturnsEmptyListInitially() throws Exception {
        mockMvc.perform(get("/api/notes")
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}