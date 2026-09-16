import api from '../utils/api';

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  icon: string;
  isActive: boolean;
  triggerType: string;
  triggerConfig?: string;
  conditions?: string;
  actions: string;
  executionCount: number;
  lastExecutedAt?: string;
  lastExecutionStatus?: string;
  createdAt: string;
}

export const TRIGGER_TYPES = [
  { id: 'NOTE_CREATED', label: 'Note Created', icon: '📝' },
  { id: 'NOTE_UPDATED', label: 'Note Updated', icon: '✏️' },
  { id: 'CONTACT_CREATED', label: 'Contact Created', icon: '👤' },
  { id: 'REMINDER_CREATED', label: 'Reminder Created', icon: '⏰' },
  { id: 'REMINDER_DUE', label: 'Reminder Due', icon: '🔔' },
  { id: 'EVENT_CREATED', label: 'Event Created', icon: '📅' },
  { id: 'EVENT_STARTING', label: 'Event Starting Soon', icon: '🔜' },
  { id: 'CONVERSATION_ENDED', label: 'Conversation Ended', icon: '💬' },
  { id: 'FILE_UPLOADED', label: 'File Uploaded', icon: '📁' },
  { id: 'SPREADSHEET_UPDATED', label: 'Spreadsheet Updated', icon: '▦' },
  { id: 'SCHEDULE', label: 'Schedule (Cron)', icon: '⏱️' },
  { id: 'MANUAL', label: 'Manual Trigger', icon: '👆' },
];

export const ACTION_TYPES = [
  { id: 'CREATE_NOTE', label: 'Create Note', icon: '📝' },
  { id: 'CREATE_REMINDER', label: 'Create Reminder', icon: '⏰' },
  { id: 'CREATE_EVENT', label: 'Create Calendar Event', icon: '📅' },
  { id: 'SEND_NOTIFICATION', label: 'Send Notification', icon: '🔔' },
  { id: 'SEND_EMAIL', label: 'Send Email', icon: '📧' },
  { id: 'AI_PROMPT', label: 'AI Prompt', icon: '🤖' },
  { id: 'WEBHOOK', label: 'Call Webhook', icon: '🌐' },
];

export async function getWorkflows(): Promise<Workflow[]> {
  const response = await api.get<Workflow[]>('/workflows');
  return response.data;
}

export async function createWorkflow(data: Partial<Workflow>): Promise<Workflow> {
  const response = await api.post<Workflow>('/workflows', data);
  return response.data;
}

export async function updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
  const response = await api.put<Workflow>(`/workflows/${id}`, data);
  return response.data;
}

export async function deleteWorkflow(id: string): Promise<void> {
  await api.delete(`/workflows/${id}`);
}

export async function toggleWorkflow(id: string): Promise<Workflow> {
  const response = await api.post<Workflow>(`/workflows/${id}/toggle`);
  return response.data;
}

export async function testWorkflow(id: string): Promise<any> {
  const response = await api.post(`/workflows/${id}/test`);
  return response.data;
}

export async function getExecutions(limit = 20): Promise<any[]> {
  const response = await api.get(`/workflows/executions`, { params: { limit } });
  return response.data;
}

export async function generateWorkflowFromAI(description: string, language = 'en-US'): Promise<Workflow> {
  const response = await api.post<Workflow>('/workflows/ai-generate', { description, language });
  return response.data;
}

export async function generateAndSaveWorkflowFromAI(description: string, language = 'en-US'): Promise<Workflow> {
  const response = await api.post<Workflow>('/workflows/ai-generate-and-save', { description, language });
  return response.data;
}

export async function getTemplates(language = 'en-US'): Promise<Workflow[]> {
  const response = await api.get<Workflow[]>('/workflows/templates', { params: { language } });
  return response.data;
}

export async function useTemplate(index: number, language = 'en-US'): Promise<Workflow> {
  const response = await api.post<Workflow>(`/workflows/templates/${index}/use`, null, { params: { language } });
  return response.data;
}

export async function getAnalytics(): Promise<any> {
  const response = await api.get('/workflows/analytics');
  return response.data;
}