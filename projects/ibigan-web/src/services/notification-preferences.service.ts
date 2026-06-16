import api from '@/lib/axios';
import type { NotificationPreferencesMap } from '@/types/notification-events';

export const notificationPreferencesService = {
  get: () =>
    api.get<{ status: number; result: NotificationPreferencesMap }>(
      '/v1/notification-preferences',
    ),

  update: (event: string, channel: string, enabled: boolean) =>
    api.patch('/v1/notification-preferences', { event, channel, enabled }),
};
