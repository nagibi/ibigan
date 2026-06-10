export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: string; error?: string } } })
    ?.response?.data;

  if (typeof data?.message === 'string' && data.message.trim().length > 0) {
    return data.message;
  }

  if (typeof data?.error === 'string' && data.error.trim().length > 0) {
    return data.error;
  }

  return fallback;
}
