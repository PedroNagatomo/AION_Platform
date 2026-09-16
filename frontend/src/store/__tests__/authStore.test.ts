import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../authStore';
import type { AuthResponse } from '../../types';

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    vi.clearAllMocks();
  });

  it('starts with no authentication', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it('setAuth stores user and token', () => {
    const authResponse: AuthResponse = {
      token: 'test-token',
      userId: 'user-id',
      email: 'test@example.com',
      name: 'Test User',
    };

    useAuthStore.getState().setAuth(authResponse);
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('test-token');
    expect(state.user?.email).toBe('test@example.com');
    expect(state.user?.id).toBe('user-id');
    expect(state.user?.name).toBe('Test User');
  });

  it('logout clears all state', () => {
    const authResponse: AuthResponse = {
      token: 'test-token',
      userId: 'user-id',
      email: 'test@example.com',
    };

    useAuthStore.getState().setAuth(authResponse);
    useAuthStore.getState().logout();
    
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});