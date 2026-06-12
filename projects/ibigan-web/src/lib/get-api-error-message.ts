import { resolveApiMessage } from '@/lib/resolve-api-message';

export function getApiErrorMessage(error: unknown, fallbackCode = 'common.error'): string {
  const data = (error as {
    response?: {
      data?: {
        message_code?: string;
        message?: string;
        error?: string;
        params?: Record<string, unknown>;
      };
    };
  })?.response?.data;

  if (data?.message_code || data?.message) {
    return resolveApiMessage(data, fallbackCode);
  }

  if (typeof data?.error === 'string' && data.error.trim().length > 0) {
    return data.error;
  }

  return resolveApiMessage(undefined, fallbackCode);
}
