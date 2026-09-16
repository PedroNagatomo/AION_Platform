package com.universalai.dto;

import com.universalai.entity.Chart;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChartDTO {
    private UUID id;
    private String name;
    private String data;
    private String chartType;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ChartDTO fromEntity(Chart chart) {
        return ChartDTO.builder()
                .id(chart.getId())
                .name(chart.getName())
                .data(chart.getData())
                .chartType(chart.getChartType())
                .createdAt(chart.getCreatedAt())
                .updatedAt(chart.getUpdatedAt())
                .build();
    }
}