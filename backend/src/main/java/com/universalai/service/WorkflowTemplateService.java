package com.universalai.service;

import com.universalai.dto.WorkflowDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowTemplateService {

    public List<WorkflowDTO> getTemplates(String language) {
        boolean pt = language != null && language.equals("pt-BR");

        return List.of(
                // 1. Lembrete para notas importantes
                WorkflowDTO.builder()
                        .name(pt ? "Lembrete para notas importantes" : "Remind for important notes")
                        .description(pt ? "Cria um lembrete quando você escreve uma nota com 'importante'" : "Creates a reminder when you write a note with 'important'")
                        .icon("🔔")
                        .triggerType("NOTE_CREATED")
                        .conditions("[{\"field\":\"title\",\"operator\":\"CONTAINS\",\"value\":\"importante\"}]")
                        .actions("[{\"type\":\"CREATE_REMINDER\",\"config\":{\"title\":\"Revisar: {{title}}\",\"minutesFromNow\":1440,\"description\":\"Nota importante criada\"}}]")
                        .isActive(true)
                        .build(),

                // 2. Follow-up automático de contatos
                WorkflowDTO.builder()
                        .name(pt ? "Follow-up de novos contatos" : "New contact follow-up")
                        .description(pt ? "Cria uma nota de follow-up e lembrete ao adicionar contato" : "Creates a follow-up note and reminder when adding a contact")
                        .icon("👥")
                        .triggerType("CONTACT_CREATED")
                        .conditions("[]")
                        .actions("[" +
                                "{\"type\":\"CREATE_NOTE\",\"config\":{\"title\":\"Follow-up: {{name}}\",\"content\":\"<p>Contato: {{name}}</p><p>Telefone: {{phone}}</p><p>Email: {{email}}</p><p>Próximos passos:</p><ul><li>Enviar mensagem de boas-vindas</li><li>Agendar conversa</li></ul>\"}}," +
                                "{\"type\":\"CREATE_REMINDER\",\"config\":{\"title\":\"Follow-up com {{name}}\",\"minutesFromNow\":4320,\"description\":\"Entrar em contato com {{name}}\"}}" +
                                "]")
                        .isActive(true)
                        .build(),

                // 3. Resumo diário de notas
                WorkflowDTO.builder()
                        .name(pt ? "Resumo diário de notas" : "Daily notes summary")
                        .description(pt ? "Todo dia às 9h cria uma nota com resumo das últimas notas" : "Every day at 9am creates a summary note")
                        .icon("📊")
                        .triggerType("SCHEDULE")
                        .triggerConfig("{\"cron\":\"0 9 * * *\"}")
                        .conditions("[]")
                        .actions("[{\"type\":\"CREATE_NOTE\",\"config\":{\"title\":\"Resumo Diário - {{date}}\",\"content\":\"<h2>Resumo do dia</h2><p>Este é seu resumo diário automático.</p><p>Revise suas notas recentes.</p>\"}}]")
                        .isActive(true)
                        .build(),

                // 4. Backup semanal
                WorkflowDTO.builder()
                        .name(pt ? "Backup semanal" : "Weekly backup")
                        .description(pt ? "Toda segunda às 10h envia backup por email" : "Every Monday at 10am sends backup by email")
                        .icon("💾")
                        .triggerType("SCHEDULE")
                        .triggerConfig("{\"cron\":\"0 10 * * 1\"}")
                        .conditions("[]")
                        .actions("[{\"type\":\"SEND_EMAIL\",\"config\":{\"subject\":\"Backup Semanal\",\"body\":\"Seu backup semanal está pronto.\"}}]")
                        .isActive(true)
                        .build(),

                // 5. Lembrete de reunião
                WorkflowDTO.builder()
                        .name(pt ? "Alerta 15min antes de reuniões" : "15min alert before meetings")
                        .description(pt ? "Notifica 15 minutos antes de qualquer evento" : "Notifies 15 minutes before any event")
                        .icon("⏰")
                        .triggerType("EVENT_STARTING")
                        .conditions("[]")
                        .actions("[{\"type\":\"SEND_NOTIFICATION\",\"config\":{\"title\":\"Reunião em 15 min\",\"message\":\"{{title}} às {{time}}\"}}]")
                        .isActive(true)
                        .build(),

                // 6. Auto-categorizar arquivos
                WorkflowDTO.builder()
                        .name(pt ? "Notificar uploads de arquivos" : "Notify file uploads")
                        .description(pt ? "Envia notificação sempre que um arquivo é enviado" : "Sends notification whenever a file is uploaded")
                        .icon("📁")
                        .triggerType("FILE_UPLOADED")
                        .conditions("[]")
                        .actions("[{\"type\":\"SEND_NOTIFICATION\",\"config\":{\"title\":\"Arquivo enviado\",\"message\":\"{{fileName}} foi enviado com sucesso\"}}]")
                        .isActive(true)
                        .build(),

                // 7. Análise de IA após conversa
                WorkflowDTO.builder()
                        .name(pt ? "Análise automática de conversas" : "Auto-analyze conversations")
                        .description(pt ? "Gera resumo e ação de follow-up após encerrar conversa" : "Generates summary and follow-up after ending a conversation")
                        .icon("🤖")
                        .triggerType("CONVERSATION_ENDED")
                        .conditions("[]")
                        .actions("[" +
                                "{\"type\":\"AI_PROMPT\",\"config\":{\"prompt\":\"Resuma os pontos principais da conversa '{{title}}' e sugira próximos passos\",\"saveTo\":\"note\"}}," +
                                "{\"type\":\"CREATE_REMINDER\",\"config\":{\"title\":\"Revisar conversa: {{title}}\",\"minutesFromNow\":2880}}" +
                                "]")
                        .isActive(true)
                        .build(),

                // 8. Boas-vindas para notas
                WorkflowDTO.builder()
                        .name(pt ? "Template de boas-vindas em novas notas" : "Welcome template for new notes")
                        .description(pt ? "Adiciona estrutura padrão quando criar notas" : "Adds standard structure when creating notes")
                        .icon("📝")
                        .triggerType("NOTE_CREATED")
                        .conditions("[{\"field\":\"content\",\"operator\":\"IS_EMPTY\",\"value\":\"\"}]")
                        .actions("[{\"type\":\"SEND_NOTIFICATION\",\"config\":{\"title\":\"Nova nota vazia\",\"message\":\"Você criou '{{title}}' - não esqueça de preencher!\"}}]")
                        .isActive(true)
                        .build(),

                // 9. Lembrete de follow-up de email
                WorkflowDTO.builder()
                        .name(pt ? "Lembrete de resposta a emails" : "Email response reminder")
                        .description(pt ? "Lembrete para responder emails importantes" : "Reminder to reply to important emails")
                        .icon("📧")
                        .triggerType("NOTE_CREATED")
                        .conditions("[{\"field\":\"title\",\"operator\":\"CONTAINS\",\"value\":\"email\"}]")
                        .actions("[{\"type\":\"CREATE_REMINDER\",\"config\":{\"title\":\"Responder: {{title}}\",\"minutesFromNow\":120,\"description\":\"Não esqueça de responder\"}}]")
                        .isActive(true)
                        .build(),

                // 10. Notificação de novos eventos
                WorkflowDTO.builder()
                        .name(pt ? "Registrar eventos em notas" : "Log events to notes")
                        .description(pt ? "Cria nota automática para cada evento criado" : "Creates automatic note for each event")
                        .icon("📅")
                        .triggerType("EVENT_CREATED")
                        .conditions("[]")
                        .actions("[{\"type\":\"CREATE_NOTE\",\"config\":{\"title\":\"Evento: {{title}}\",\"content\":\"<p>Data: {{date}}</p><p>Hora: {{time}}</p><p>{{description}}</p>\"}}]")
                        .isActive(true)
                        .build()
        );
    }
}