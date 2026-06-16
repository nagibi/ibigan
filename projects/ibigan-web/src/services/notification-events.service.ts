import api from '@/lib/axios';
import type { ApiNotificationEventsResponse } from '@/types/notification-events';

export const notificationEventsService = {
  list: (params?: { module?: string }) =>
    api.get<ApiNotificationEventsResponse>('/v1/notification-events', { params }),
};
