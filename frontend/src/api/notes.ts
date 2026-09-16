import api from '../utils/api';

export interface Note {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  isFolder: boolean;
  tags: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export async function getNotes(): Promise<Note[]> {
  const response = await api.get<Note[]>('/notes');
  return response.data;
}

export async function createNote(data: Partial<Note>): Promise<Note> {
  const response = await api.post<Note>('/notes', data);
  return response.data;
}

export async function updateNote(id: string, data: Partial<Note>): Promise<Note> {
  const response = await api.put<Note>(`/notes/${id}`, data);
  return response.data;
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/notes/${id}`);
}

export async function searchNotes(query: string): Promise<Note[]> {
  const response = await api.get<Note[]>('/notes/search', { params: { q: query } });
  return response.data;
}

export async function renameNote(id: string, title: string): Promise<Note> {
  const response = await api.put<Note>(`/notes/${id}/rename`, { title });
  return response.data;
}