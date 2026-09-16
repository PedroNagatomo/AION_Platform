import api from '../utils/api';

export async function exportConversationMarkdown(conversationId: string): Promise<Blob> {
  const response = await api.get(`/export/conversation/${conversationId}/markdown`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function exportConversationTxt(conversationId: string): Promise<Blob> {
  const response = await api.get(`/export/conversation/${conversationId}/txt`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function exportNoteMarkdown(noteId: string): Promise<Blob> {
  const response = await api.get(`/export/note/${noteId}/markdown`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function exportNoteTxt(noteId: string): Promise<Blob> {
  const response = await api.get(`/export/note/${noteId}/txt`, {
    responseType: 'blob',
  });
  return response.data;
}

export async function exportBackup(): Promise<Blob> {
  const response = await api.get('/export/backup', {
    responseType: 'blob',
  });
  return response.data;
}