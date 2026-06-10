import api from '@/lib/axios';
import type { CentralUser } from '@/stores/central-auth.store';

export const centralAuthService = {
  login: (email: string, password: string) =>
    api.post<{ status: number; result: { token: string; user: CentralUser } }>(
      '/central/v1/auth/login',
      { email, password },
    ),

  me: () =>
    api.get<{ status: number; result: CentralUser }>('/central/v1/auth/me'),

  logout: () => api.post('/central/v1/auth/logout'),
};
