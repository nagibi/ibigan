import api from '@/lib/axios';
import { twoFactorApiBase } from '@/lib/profile-api';

export type TwoFactorMethod = 'totp' | 'email';

export interface TwoFactorStatusResponse {
  status: number;
  result: {
    enabled: boolean;
    method: TwoFactorMethod | null;
    masked_email: string;
    recovery_codes: string[];
  };
}

export interface TwoFactorEnableResponse {
  status: number;
  result: {
    method: TwoFactorMethod;
    secret?: string;
    qr_code_url?: string;
    masked_email?: string;
    recovery_codes: string[];
  };
}

export interface RecoveryCodesResponse {
  status: number;
  result: {
    method?: TwoFactorMethod;
    recovery_codes: string[];
  };
}

export const twoFactorService = {
  status: () =>
    api.get<TwoFactorStatusResponse>(`${twoFactorApiBase()}/status`),

  enable: (method: TwoFactorMethod = 'totp') =>
    api.post<TwoFactorEnableResponse>(`${twoFactorApiBase()}/enable`, { method }),

  confirm: (code: string) =>
    api.post(`${twoFactorApiBase()}/confirm`, { code }),

  resendSetupCode: () =>
    api.post<{ status: number; result: { masked_email: string } }>(`${twoFactorApiBase()}/resend-setup-code`),

  disable: (password: string) =>
    api.post(`${twoFactorApiBase()}/disable`, { password }),

  recoveryCodes: () =>
    api.get<RecoveryCodesResponse>(`${twoFactorApiBase()}/recovery-codes`),

  regenerateRecoveryCodes: () =>
    api.post<RecoveryCodesResponse>(`${twoFactorApiBase()}/recovery-codes`),

  resendLoginCode: (two_factor_token: string) =>
    api.post<{ status: number; result: { masked_email: string } }>('/v1/auth/two-factor-resend', {
      two_factor_token,
    }),
};
