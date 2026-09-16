package com.universalai.service;

import com.universalai.dto.AgentDTO;
import com.universalai.entity.Agent;
import com.universalai.entity.User;
import com.universalai.repository.AgentRepository;
import com.universalai.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AgentService {

    private final AgentRepository agentRepository;
    private final UserRepository userRepository;

    /**
     * Agentes padrão que são criados para cada novo usuário
     */
    public static final List<Map<String, String>> DEFAULT_AGENTS = List.of(
            Map.of(
                    "name", "General Assistant",
                    "icon", "🤖",
                    "description", "General purpose AI assistant for everyday tasks",
                    "systemPrompt", "You are a helpful, friendly AI assistant. Answer questions clearly and concisely."
            ),
            Map.of(
                    "name", "Code Assistant",
                    "icon", "💻",
                    "description", "Specialized in programming, code review, and debugging",
                    "systemPrompt", "You are an expert software engineer. Help with coding questions, code review, debugging, architecture design, and best practices. Always provide code examples with proper formatting. Explain your reasoning clearly."
            ),
            Map.of(
                    "name", "Translator",
                    "icon", "🌐",
                    "description", "Translates between multiple languages with context",
                    "systemPrompt", "You are a professional translator. Translate text between languages while preserving meaning, tone, and context. Provide the translation followed by brief notes on any cultural nuances or alternative translations when relevant."
            ),
            Map.of(
                    "name", "Summarizer",
                    "icon", "📝",
                    "description", "Creates concise summaries of long texts",
                    "systemPrompt", "You are an expert summarizer. Create clear, concise summaries of any text provided. Highlight key points, main ideas, and important details. Use bullet points for clarity when appropriate."
            ),
            Map.of(
                    "name", "Researcher",
                    "icon", "🔍",
                    "description", "Deep research and analysis on any topic",
                    "systemPrompt", "You are a research assistant. Provide thorough, well-organized information on any topic. Structure answers with headings, bullet points, and key findings. Cite sources when possible and note any uncertainties."
            ),
            Map.of(
                    "name", "Creative Writer",
                    "icon", "✍️",
                    "description", "Helps with creative writing, stories, and content",
                    "systemPrompt", "You are a creative writing assistant. Help with stories, articles, essays, and creative content. Be imaginative and engaging while maintaining the user's desired tone and style."
            ),
            Map.of(
                    "name", "Math Tutor",
                    "icon", "📐",
                    "description", "Explains mathematical concepts step by step",
                    "systemPrompt", "You are a patient math tutor. Explain mathematical concepts step by step with clear examples. Break down complex problems into manageable parts. Verify your answers carefully."
            ),
            Map.of(
                    "name", "Business Advisor",
                    "icon", "💼",
                    "description", "Strategic business and management advice",
                    "systemPrompt", "You are a business advisor. Provide strategic advice on business planning, management, marketing, and growth. Think analytically and provide actionable recommendations."
            )
    );

    /**
     * Cria agentes padrão para um novo usuário
     */
    @Transactional
    public void createDefaultAgentsForUser(User user) {
        for (Map<String, String> agentData : DEFAULT_AGENTS) {
            Agent agent = Agent.builder()
                    .user(user)
                    .name(agentData.get("name"))
                    .icon(agentData.get("icon"))
                    .description(agentData.get("description"))
                    .systemPrompt(agentData.get("systemPrompt"))
                    .isDefault(true)
                    .isActive(true)
                    .build();
            agentRepository.save(agent);
        }
        log.debug("Created {} default agents for user: {}", DEFAULT_AGENTS.size(), user.getEmail());
    }

    @Transactional(readOnly = true)
    public List<AgentDTO> getUserAgents(UUID userId) {
        return agentRepository.findByUserIdAndIsActiveTrueOrderByNameAsc(userId)
                .stream()
                .map(AgentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public AgentDTO createAgent(UUID userId, AgentDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Agent agent = Agent.builder()
                .user(user)
                .name(dto.getName())
                .icon(dto.getIcon() != null ? dto.getIcon() : "🤖")
                .description(dto.getDescription() != null ? dto.getDescription() : "")
                .systemPrompt(dto.getSystemPrompt())
                .isDefault(false)
                .isActive(true)
                .build();

        return AgentDTO.fromEntity(agentRepository.save(agent));
    }

    @Transactional
    public AgentDTO updateAgent(UUID agentId, UUID userId, AgentDTO dto) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        if (!agent.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        if (dto.getName() != null) agent.setName(dto.getName());
        if (dto.getIcon() != null) agent.setIcon(dto.getIcon());
        if (dto.getDescription() != null) agent.setDescription(dto.getDescription());
        if (dto.getSystemPrompt() != null) agent.setSystemPrompt(dto.getSystemPrompt());
        if (dto.getIsActive() != null) agent.setIsActive(dto.getIsActive());

        return AgentDTO.fromEntity(agentRepository.save(agent));
    }

    @Transactional
    public void deleteAgent(UUID agentId, UUID userId) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        if (!agent.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        if (Boolean.TRUE.equals(agent.getIsDefault())) {
            // Soft delete for default agents
            agent.setIsActive(false);
            agentRepository.save(agent);
        } else {
            // Hard delete for custom agents
            agentRepository.delete(agent);
        }
    }

    @Transactional(readOnly = true)
    public String getAgentSystemPrompt(UUID agentId, UUID userId) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        if (!agent.getUser().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        return agent.getSystemPrompt();
    }
}