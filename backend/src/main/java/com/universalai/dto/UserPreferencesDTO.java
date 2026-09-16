package com.universalai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferencesDTO {
    private String theme;           // dark, light, terminal
    private String accentColor;     // #00ff00, #00cc00, etc.
    private String fontFamily;      // Roboto Mono, Fira Code, etc.
    private Integer fontSize;       // 12, 14, 16, 18
    private String sidebarOrder;    // JSON array com ordem dos itens
    private String aiModel;         // modelo de IA preferido
    private Double aiTemperature;   // temperatura do modelo
    private Integer aiMaxTokens;    // max tokens
    private Boolean soundEnabled;   // som ao receber resposta
    private Boolean notificationsEnabled; // notificações
    private Boolean compactMode;    // modo compacto
}