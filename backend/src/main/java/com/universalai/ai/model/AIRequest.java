package com.universalai.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIRequest {
    private List<ChatMessage> messages;
    private Double temperature;
    private Integer maxTokens;
    private String model;
}