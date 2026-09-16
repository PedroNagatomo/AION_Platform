import api from '../utils/api';

export interface SearchResult {
  id: string;
  title: string;
  type: string;
  icon: string;
  subtitle: string;
  path: string;
  updatedAt: string;
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const response = await api.get<SearchResult[]>('/search', { params: { q: query } });
  return response.data;
}