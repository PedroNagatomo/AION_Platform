import api from '../utils/api';

export interface Whiteboard {
  id: string;
  name: string;
  data: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export async function getWhiteboards(): Promise<Whiteboard[]> {
  const response = await api.get<Whiteboard[]>('/whiteboards');
  return response.data;
}

export async function createWhiteboard(data: Partial<Whiteboard>): Promise<Whiteboard> {
  const response = await api.post<Whiteboard>('/whiteboards', data);
  return response.data;
}

export async function updateWhiteboard(id: string, data: Partial<Whiteboard>): Promise<Whiteboard> {
  const response = await api.put<Whiteboard>(`/whiteboards/${id}`, data);
  return response.data;
}

export async function deleteWhiteboard(id: string): Promise<void> {
  await api.delete(`/whiteboards/${id}`);
}