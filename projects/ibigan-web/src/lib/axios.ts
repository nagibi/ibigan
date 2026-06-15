import axios from 'axios';
import { applyTenantHostHeader, resolveApiBaseUrl } from '@/lib/api-base-url';
import { trackApiRequestEnd, trackApiRequestStart } from '@/lib/api-loading-bar';
import { isCentralApiRoute } from '@/lib/central-api';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  trackApiRequestStart();

  if (!config.headers) {
    config.headers = {};
  }

  applyTenantHostHeader(config.headers as Record<string, string>);

  const url = config.url ?? '';

  if (isCentralApiRoute(url)) {
    const centralToken = localStorage.getItem('ibigan_central_token');
    if (centralToken) {
      config.headers.Authorization = `Bearer ${centralToken}`;
    }
    delete config.headers['X-Tenant-ID'];
  } else {
    const token = localStorage.getItem('ibigan_token');
    const tenantId = localStorage.getItem('ibigan_tenant_id');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
  }

  return config;
});

function handleCentralUnauthorized() {
  localStorage.removeItem('ibigan_central_token');
  useCentralAuthStore.getState().centralLogout();
  window.location.href = '/central/login';
}

function handleTenantUnauthorized() {
  localStorage.removeItem('ibigan_token');
  localStorage.removeItem('ibigan_tenant_id');
  localStorage.removeItem('ibigan-auth');
  useAuthStore.getState().logout();
  window.location.href = '/auth/login';
}

api.interceptors.response.use(
  (response) => {
    trackApiRequestEnd();
    return response;
  },
  async (error) => {
    trackApiRequestEnd();

    const status = error.response?.status;
    const url = error.config?.url ?? '';
    const isCentral = isCentralApiRoute(url);

    if (status === 401) {
      if (isCentral) {
        handleCentralUnauthorized();
        return Promise.reject(error);
      }

      // se há QUALQUER sessão central ativa, nunca expulsa pro login de tenant
      // (cobre impersonação e transição de saída)
      const hasCentralSession =
        useCentralAuthStore.getState().isCentralAuthenticated ||
        Boolean(localStorage.getItem('ibigan_central_token'));

      if (hasCentralSession) {
        return Promise.reject(error);
      }

      handleTenantUnauthorized();
      return Promise.reject(error);
    }

    if (status === 403) {
      if (isCentral) {
        return Promise.reject(error);
      }

      const token = localStorage.getItem('ibigan_token');
      if (token) {
        try {
          await api.get('/v1/auth/me');
          return Promise.reject(error);
        } catch (meError: unknown) {
          if ((meError as { response?: { status?: number } })?.response?.status === 401) {
            const isCentralAuthenticated = useCentralAuthStore.getState().isCentralAuthenticated;
            if (!isCentralAuthenticated) {
              handleTenantUnauthorized();
            }
          }
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
