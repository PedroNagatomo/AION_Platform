import api from '../utils/api';

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  reminderTime: string;
  isCompleted: boolean;
  repeatType: string;
  notifyBeforeMinutes: number;
  createdAt: string;
}

export async function getReminders(): Promise<Reminder[]> {
  const response = await api.get<Reminder[]>('/reminders');
  return response.data;
}

export async function getActiveReminders(): Promise<Reminder[]> {
  const response = await api.get<Reminder[]>('/reminders/active');
  return response.data;
}

export async function getDueReminders(): Promise<Reminder[]> {
  const response = await api.get<Reminder[]>('/reminders/due');
  return response.data;
}

export async function createReminder(data: Partial<Reminder>): Promise<Reminder> {
  const response = await api.post<Reminder>('/reminders', data);
  return response.data;
}

export async function updateReminder(id: string, data: Partial<Reminder>): Promise<Reminder> {
  const response = await api.put<Reminder>(`/reminders/${id}`, data);
  return response.data;
}

export async function completeReminder(id: string): Promise<void> {
  await api.post(`/reminders/${id}/complete`);
}

export async function deleteReminder(id: string): Promise<void> {
  await api.delete(`/reminders/${id}`);
}