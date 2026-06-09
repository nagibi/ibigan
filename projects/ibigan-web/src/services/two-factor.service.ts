import api from '@/lib/axios';

export interface TwoFactorEnableResponse {
  status: number;
  result: {
    secret: string;
    qr_code_url: string;
    recovery_codes: string[];
  };
}

export interface RecoveryCodesResponse {
  status: number;
  result: {
    recovery_codes: string[];
  };
}

export const twoFactorService = {
  enable: () =>
    api.post<TwoFactorEnableResponse>('/v1/two-factor/enable'),

  confirm: (code: string) =>
    api.post('/v1/two-factor/confirm', { code }),

  disable: (password: string) =>
    api.post('/v1/two-factor/disable', { password }),

  recoveryCodes: () =>
    api.get<RecoveryCodesResponse>('/v1/two-factor/recovery-codes'),

  regenerateRecoveryCodes: () =>
    api.post<RecoveryCodesResponse>('/v1/two-factor/recovery-codes'),
};
