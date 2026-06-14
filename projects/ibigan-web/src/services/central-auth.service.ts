import api from '@/lib/axios';
import type { CentralUser } from '@/stores/central-auth.store';

export interface CentralLoginResult {
  token?: string;
  user?: CentralUser;
  requires_2fa?: boolean;
  two_factor_token?: string;
  two_factor_method?: 'totp' | 'email';
  masked_email?: string;
  scope?: 'central';
}

export const centralAuthService = {
  login: (email: string, password: string) =>
    api.post<{ status: number; result: CentralLoginResult }>(
      '/central/v1/auth/login',
      { email, password },
    ),

  twoFactorChallenge: (payload: { two_factor_token: string; code: string }) =>
    api.post<{ status: number; result: { token: string; user: CentralUser; scope?: 'central' } }>(
      '/v1/auth/two-factor-challenge',
      payload,
    ),

  me: () =>
    api.get<{ status: number; result: CentralUser }>('/central/v1/auth/me'),

  logout: () => api.post('/central/v1/auth/logout'),
};
