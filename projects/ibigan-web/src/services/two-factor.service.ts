import api from '@/lib/axios';

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
    api.get<TwoFactorStatusResponse>('/v1/two-factor/status'),

  enable: (method: TwoFactorMethod = 'totp') =>
    api.post<TwoFactorEnableResponse>('/v1/two-factor/enable', { method }),

  confirm: (code: string) =>
    api.post('/v1/two-factor/confirm', { code }),

  resendSetupCode: () =>
    api.post<{ status: number; result: { masked_email: string } }>('/v1/two-factor/resend-setup-code'),

  disable: (password: string) =>
    api.post('/v1/two-factor/disable', { password }),

  recoveryCodes: () =>
    api.get<RecoveryCodesResponse>('/v1/two-factor/recovery-codes'),

  regenerateRecoveryCodes: () =>
    api.post<RecoveryCodesResponse>('/v1/two-factor/recovery-codes'),

  resendLoginCode: (two_factor_token: string) =>
    api.post<{ status: number; result: { masked_email: string } }>('/v1/auth/two-factor-resend', {
      two_factor_token,
    }),
};
