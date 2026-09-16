import { create } from 'zustand';
import type { AuthResponse, User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (auth: AuthResponse) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  setAuth: (auth: AuthResponse) => {
    const user: User = {
      id: auth.userId,
      email: auth.email,
      name: auth.name,
    };
    localStorage.setItem('token', auth.token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token: auth.token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null, token: null });
      return false;
    }
    
    // Verificar se o token está expirado (decodificar JWT)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiration = payload.exp * 1000; // Converter para milissegundos
      
      if (Date.now() >= expiration) {
        console.log('Token expirado detectado no checkAuth');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ isAuthenticated: false, user: null, token: null });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ isAuthenticated: false, user: null, token: null });
      return false;
    }
  },
}));