import api from '../utils/api';

export interface UserFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  folderName?: string;
  isFavorite: boolean;
  thumbnail?: string;
  createdAt: string;
}

export async function getFiles(folder?: string): Promise<UserFile[]> {
  const response = await api.get<UserFile[]>('/files', { params: folder ? { folder } : undefined });
  return response.data;
}

export async function getFavorites(): Promise<UserFile[]> {
  const response = await api.get<UserFile[]>('/files/favorites');
  return response.data;
}

export async function getFolders(): Promise<string[]> {
  const response = await api.get<string[]>('/files/folders');
  return response.data;
}

export async function uploadFiles(files: File[], folder?: string): Promise<UserFile[]> {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  if (folder) formData.append('folder', folder);
  
  const response = await api.post<UserFile[]>('/files/upload', formData);
  return response.data;
}

export async function toggleFavorite(fileId: string): Promise<void> {
  await api.post(`/files/${fileId}/favorite`);
}

export async function moveToFolder(fileId: string, folder: string): Promise<void> {
  await api.put(`/files/${fileId}/move`, { folder });
}

export async function deleteFile(fileId: string): Promise<void> {
  await api.delete(`/files/${fileId}`);
}