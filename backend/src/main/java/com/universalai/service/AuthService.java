package com.universalai.service;

import com.universalai.dto.AuthRequest;
import com.universalai.dto.AuthResponse;
import com.universalai.entity.User;
import com.universalai.repository.MemoryEntryRepository;
import com.universalai.repository.UserRepository;
import com.universalai.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j; // ADICIONAR
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j // ADICIONAR
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final AgentService agentService;
    private final AdvancedMemoryService advancedMemoryService; // ADICIONAR
    private final MemoryEntryRepository memoryEntryRepository; // ADICIONAR

    @Transactional
    public AuthResponse register(AuthRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email já cadastrado");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();

        userRepository.save(user);

        String token = jwtService.generateToken(
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPasswordHash(),
                        Collections.emptyList()
                )
        );

        agentService.createDefaultAgentsForUser(user);

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .build();
    }

    @Transactional
    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        String token = jwtService.generateToken(
                new org.springframework.security.core.userdetails.User(
                        user.getEmail(),
                        user.getPasswordHash(),
                        Collections.emptyList()
                )
        );

        // AUTO-INDEXAR SE A MEMÓRIA ESTIVER VAZIA
        try {
            long memoryCount = memoryEntryRepository.countByUserId(user.getId());
            if (memoryCount == 0) {
                log.info("🔄 First login detected - indexing all data for user: {}", user.getEmail());
                advancedMemoryService.indexAllUserData(user.getId());
                log.info("✅ Auto-indexing complete for user: {}", user.getEmail());
            } else {
                log.debug("User {} already has {} memories", user.getEmail(), memoryCount);
            }
        } catch (Exception e) {
            log.error("Error during auto-indexing for user {}: {}", user.getEmail(), e.getMessage());
            // Não falhar o login por causa de erro na indexação
        }

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .build();
    }
}