import api from '../utils/api';

export interface IntegrationInfo {
  provider: string;
  connected: boolean;
  connectedAt?: string;
}

export async function getIntegrations(): Promise<IntegrationInfo[]> {
  const response = await api.get<IntegrationInfo[]>('/integrations');
  return response.data;
}

export async function connectIntegration(
  provider: string,
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  await api.post(`/integrations/${provider}/connect`, { accessToken, refreshToken });
}

export async function disconnectIntegration(provider: string): Promise<void> {
  await api.delete(`/integrations/${provider}`);
}

export async function testGitHubConnection(accessToken: string): Promise<any> {
  const response = await api.post('/integrations/github/test', { accessToken });
  return response.data;
}

export async function testNotionConnection(accessToken: string): Promise<any> {
  const response = await api.post('/integrations/notion/test', { accessToken });
  return response.data;
}

export async function searchNotionPages(query?: string): Promise<any[]> {
  const response = await api.get('/integrations/notion/pages', { params: query ? { query } : undefined });
  return response.data;
}

export async function searchNotionDatabases(): Promise<any[]> {
  const response = await api.get('/integrations/notion/databases');
  return response.data;
}

export async function createNotionPage(parentId: string, title: string, content: string): Promise<any> {
  const response = await api.post('/integrations/notion/pages', { parentId, title, content });
  return response.data;
}

export async function syncNoteToNotion(
  parentPageId: string,
  noteTitle: string,
  noteContent: string
): Promise<any> {
  const response = await api.post('/integrations/notion/sync-note', {
    parentPageId,
    noteTitle,
    noteContent,
  });
  return response.data;
}

export async function getGitHubOAuthUrl(): Promise<string> {
  const response = await api.get('/integrations/github/oauth-url');
  return response.data.url;
}

export async function getGitHubRepositories(): Promise<any[]> {
  const response = await api.get('/integrations/github/repositories');
  return response.data;
}