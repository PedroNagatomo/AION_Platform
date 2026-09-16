import api from '../utils/api';

export interface Agent {
  id: string;
  name: string;
  icon: string;
  description: string;
  systemPrompt: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export async function getAgents(): Promise<Agent[]> {
  const response = await api.get<Agent[]>('/agents');
  return response.data;
}

export async function createAgent(data: Partial<Agent>): Promise<Agent> {
  const response = await api.post<Agent>('/agents', data);
  return response.data;
}

export async function updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
  const response = await api.put<Agent>(`/agents/${id}`, data);
  return response.data;
}

export async function deleteAgent(id: string): Promise<void> {
  await api.delete(`/agents/${id}`);
}

export async function initializeAgents(): Promise<Agent[]> {
  const response = await api.post<Agent[]>('/agents/init');
  return response.data;
}