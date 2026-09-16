import api from '../utils/api';
import type { AuthResponse } from '../types';

export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/register', { email, password });
  return response.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', { email, password });
  return response.data;
}