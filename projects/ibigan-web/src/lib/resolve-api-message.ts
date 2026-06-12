import i18n from '@/i18n/i18next';

export interface ApiMessagePayload {
  message_code?: string;
  message?: string;
  params?: Record<string, unknown>;
  severity?: string;
}

export function resolveApiMessage(
  payload: ApiMessagePayload | undefined,
  fallbackCode = 'common.error',
): string {
  const code = payload?.message_code ?? payload?.message;
  if (!code) {
    return i18n.t(fallbackCode);
  }

  if (code.startsWith('MSG')) {
    return code;
  }

  return i18n.t(code, payload?.params ?? {});
}
