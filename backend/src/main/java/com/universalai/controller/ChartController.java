package com.universalai.controller;

import com.universalai.dto.ChartDTO;
import com.universalai.entity.Chart;
import com.universalai.entity.User;
import com.universalai.repository.ChartRepository;
import com.universalai.repository.UserRepository;
import com.universalai.service.AdvancedMemoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/charts")
@RequiredArgsConstructor
public class ChartController {

    private final ChartRepository chartRepository;
    private final UserRepository userRepository;
    private final AdvancedMemoryService advancedMemoryService; // ADICIONADO

    @GetMapping
    public ResponseEntity<List<ChartDTO>> getAll() {
        UUID userId = getCurrentUserId();
        return ResponseEntity.ok(chartRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream().map(ChartDTO::fromEntity).collect(Collectors.toList()));
    }

    @PostMapping
    public ResponseEntity<ChartDTO> create(@RequestBody Map<String, String> request) {
        UUID userId = getCurrentUserId();
        User user = userRepository.findById(userId).orElseThrow();

        Chart chart = Chart.builder()
                .user(user)
                .name(request.getOrDefault("name", "New Chart"))
                .data(request.getOrDefault("data", "[]"))
                .chartType(request.getOrDefault("chartType", "line"))
                .build();

        Chart saved = chartRepository.save(chart);

        // INDEXAR
        advancedMemoryService.indexChart(saved.getId(), userId);

        return ResponseEntity.ok(ChartDTO.fromEntity(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ChartDTO> update(@PathVariable UUID id, @RequestBody Map<String, String> request) {
        Chart chart = chartRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Chart not found"));

        if (request.containsKey("name")) chart.setName(request.get("name"));
        if (request.containsKey("data")) chart.setData(request.get("data"));
        if (request.containsKey("chartType")) chart.setChartType(request.get("chartType"));

        Chart updated = chartRepository.save(chart);

        // RE-INDEXAR
        advancedMemoryService.indexChart(updated.getId(), getCurrentUserId());

        return ResponseEntity.ok(ChartDTO.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        chartRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}