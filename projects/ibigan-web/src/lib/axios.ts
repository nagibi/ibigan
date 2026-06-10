import axios from 'axios';
import { trackApiRequestEnd, trackApiRequestStart } from '@/lib/api-loading-bar';
import { useAuthStore } from '@/stores/auth.store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  trackApiRequestStart();

  const token    = localStorage.getItem('ibigan_token');
  const tenantId = localStorage.getItem('ibigan_tenant_id');

  if (token)    config.headers.Authorization  = `Bearer ${token}`;
  if (tenantId) config.headers['X-Tenant-ID'] = tenantId;

  return config;
});

api.interceptors.response.use(
  (response) => {
    trackApiRequestEnd();
    return response;
  },
  async (error) => {
    trackApiRequestEnd();

    const status = error.response?.status;

    if (status === 401) {
      // Token inválido — logout imediato
      localStorage.removeItem('ibigan_token');
      localStorage.removeItem('ibigan_tenant_id');
      useAuthStore.getState().logout();
      window.location.href = '/auth/login';
      return Promise.reject(error);
    }

    if (status === 403) {
      // Permissão negada — pode ser token expirado/inválido
      // Tentar verificar se o token ainda é válido
      const token = localStorage.getItem('ibigan_token');
      if (token) {
        try {
          await api.get('/v1/auth/me');
          // Token ainda válido — é realmente 403 de permissão
          return Promise.reject(error);
        } catch (meError: unknown) {
          if ((meError as { response?: { status?: number } })?.response?.status === 401) {
            // Token inválido — logout
            localStorage.removeItem('ibigan_token');
            localStorage.removeItem('ibigan_tenant_id');
            useAuthStore.getState().logout();
            window.location.href = '/auth/login';
          }
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;