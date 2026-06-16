import api from '@/lib/axios';
import type {
  ApiNotificationRulesResponse,
  NotificationRule,
  NotificationTenantRules,
} from '@/types/notification-events';

export const notificationRulesService = {
  get: () => api.get<ApiNotificationRulesResponse>('/v1/notification-rules'),

  update: (rules: NotificationTenantRules) =>
    api.put<ApiNotificationRulesResponse>('/v1/notification-rules', rules),

  upsertEvent: (eventSlug: string, rule: NotificationRule) =>
    api.patch<ApiNotificationRulesResponse>(`/v1/notification-rules/${eventSlug}`, rule),
};
