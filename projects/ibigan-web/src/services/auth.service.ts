import api from '@/lib/axios';

export interface LoginPayload {
  email: string;
  password: string;
  tenant_id: string;
}

export interface LoginResponse {
  status: number;
  result: {
    token: string;
    tenant_id: string;
    requires_2fa?: boolean;
    two_factor_token?: string;
    user: {
      id: number;
      name: string;
      email: string;
      roles: string[];
      permissions: string[];
    };
  };
}

export interface TwoFactorPayload {
  two_factor_token: string;
  code: string;
  tenant_id: string;
}

export interface UserTenant {
  id: string;
  slug: string;
  name: string | null;
  is_default: boolean;
}

export const authService = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/v1/auth/login', payload),

  register: (payload: {
    company_name: string;
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => api.post<LoginResponse>('/v1/auth/register', payload),

  twoFactorChallenge: (payload: TwoFactorPayload) =>
    api.post<LoginResponse>('/v1/auth/two-factor-challenge', payload),

  logout: () => api.post('/v1/auth/logout'),

  me: () => api.get('/v1/auth/me'),

  listTenants: () =>
    api.get<{ status: number; result: UserTenant[] }>('/central/v1/tenants'),

  switchTenant: (tenant_id: string) =>
    api.post<{ status: number; result: { token: string; tenant_id: string } }>(
      '/central/v1/tenants/switch',
      { tenant_id },
    ),

  forgotPassword: (email: string, tenant_id: string) =>
    api.post('/v1/auth/forgot-password', { email, tenant_id }),

  resetPassword: (payload: {
    email: string;
    token: string;
    tenant_id: string;
    password: string;
    password_confirmation: string;
  }) => api.post('/v1/auth/reset-password', payload),
};
