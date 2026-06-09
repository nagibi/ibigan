import api from '@/lib/axios';

export const notificationPreferencesService = {
  get: () =>
    api.get<{ status: number; result: Record<string, { email: boolean; app: boolean }> }>(
      '/v1/notification-preferences',
    ),

  update: (event: string, channel: string, enabled: boolean) =>
    api.patch('/v1/notification-preferences', { event, channel, enabled }),
};
