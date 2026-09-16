import axios, { type AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // NÃO definir Content-Type manualmente para FormData
    // O Axios define automaticamente o boundary correto
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratar erros
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    console.log('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });
    
    // Só redirecionar para login se for REALMENTE token expirado
    if (error.response?.status === 401) {
      const responseData = error.response?.data as any;
      
      // Verificar se é realmente token expirado
      const isExpiredToken = 
        responseData?.expired === true ||
        responseData?.message?.toLowerCase().includes('expired') ||
        responseData?.message?.toLowerCase().includes('expirado');
      
      if (isExpiredToken) {
        console.log('Token expirado. Redirecionando para login...');
        
        // Limpar dados
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirecionar
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else {
        console.log('Erro 401 mas não é token expirado:', responseData);
        // Pode ser credencial inválida no login, ou outro problema
        // NÃO redirecionar automaticamente
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;