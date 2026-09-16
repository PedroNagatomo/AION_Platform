package com.universalai.service;

import com.universalai.dto.WorkflowDTO;
import com.universalai.entity.User;
import com.universalai.entity.Workflow;
import com.universalai.repository.UserRepository;
import com.universalai.repository.WorkflowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {

    @Mock
    private WorkflowRepository workflowRepository;

    @Mock
    private WorkflowAsyncExecutor asyncExecutor;  // ← Mudou de executorService

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WorkflowService workflowService;

    private User testUser;
    private Workflow testWorkflow;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .build();

        testWorkflow = Workflow.builder()
                .id(UUID.randomUUID())
                .user(testUser)
                .name("Test Workflow")
                .triggerType("NOTE_CREATED")
                .actions("[{\"type\":\"CREATE_REMINDER\",\"config\":{}}]")
                .isActive(true)
                .executionCount(0L)
                .build();
    }

    @Test
    void testCreateWorkflow_Success() {
        WorkflowDTO dto = WorkflowDTO.builder()
                .name("New Workflow")
                .triggerType("NOTE_CREATED")
                .actions("[{\"type\":\"SEND_NOTIFICATION\",\"config\":{}}]")
                .build();

        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(workflowRepository.save(any(Workflow.class))).thenAnswer(inv -> {
            Workflow w = inv.getArgument(0);
            w.setId(UUID.randomUUID());
            return w;
        });

        WorkflowDTO result = workflowService.createWorkflow(testUser.getId(), dto);

        assertNotNull(result);
        assertEquals("New Workflow", result.getName());
        assertEquals("NOTE_CREATED", result.getTriggerType());
        assertTrue(result.getIsActive());

        verify(userRepository, times(1)).findById(testUser.getId());
        verify(workflowRepository, times(1)).save(any(Workflow.class));
    }

    @Test
    void testToggleWorkflow_ActivatesInactiveWorkflow() {
        testWorkflow.setIsActive(false);
        when(workflowRepository.findById(testWorkflow.getId())).thenReturn(Optional.of(testWorkflow));
        when(workflowRepository.save(any(Workflow.class))).thenReturn(testWorkflow);

        WorkflowDTO result = workflowService.toggleWorkflow(testWorkflow.getId(), testUser.getId());

        assertNotNull(result);
        assertTrue(result.getIsActive());
        verify(workflowRepository, times(1)).save(testWorkflow);
    }

    @Test
    void testDeleteWorkflow_ThrowsWhenNotOwner() {
        UUID otherUserId = UUID.randomUUID();
        when(workflowRepository.findById(testWorkflow.getId())).thenReturn(Optional.of(testWorkflow));

        RuntimeException exception = assertThrows(RuntimeException.class, () ->
                workflowService.deleteWorkflow(testWorkflow.getId(), otherUserId)
        );

        assertEquals("Access denied", exception.getMessage());
        verify(workflowRepository, never()).delete(any(Workflow.class));
    }

    @Test
    void testTriggerWorkflows_ExecutesAllMatchingWorkflows() {
        // Arrange
        List<Workflow> workflows = List.of(testWorkflow);
        Map<String, Object> eventData = Map.of("title", "Test Note");

        when(workflowRepository.findActiveByTriggerType(testUser.getId(), "NOTE_CREATED"))
                .thenReturn(workflows);

        // Act
        workflowService.triggerWorkflows(testUser.getId(), "NOTE_CREATED", eventData);

        // Assert - Verificar se o asyncExecutor foi chamado
        verify(asyncExecutor, times(1)).executeAsync(
                eq(testWorkflow.getId()),
                any(Map.class)
        );
    }

    @Test
    void testGetUserWorkflows_ReturnsSortedByCreatedAt() {
        List<Workflow> workflows = List.of(testWorkflow);
        when(workflowRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId()))
                .thenReturn(workflows);

        List<WorkflowDTO> result = workflowService.getUserWorkflows(testUser.getId());

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Workflow", result.get(0).getName());
    }
}