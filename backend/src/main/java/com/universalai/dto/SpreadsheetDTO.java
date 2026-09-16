package com.universalai.dto;

import com.universalai.entity.Spreadsheet;
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
public class SpreadsheetDTO {
    private UUID id;
    private String name;
    private String data;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static SpreadsheetDTO fromEntity(Spreadsheet spreadsheet) {
        return SpreadsheetDTO.builder()
                .id(spreadsheet.getId())
                .name(spreadsheet.getName())
                .data(spreadsheet.getData())
                .createdAt(spreadsheet.getCreatedAt())
                .updatedAt(spreadsheet.getUpdatedAt())
                .build();
    }
}