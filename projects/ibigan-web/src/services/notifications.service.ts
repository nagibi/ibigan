import api from '@/lib/axios';

export interface AppNotification {
  id: string;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export const notificationsService = {
  list: (page = 1, perPage = 15) =>
    api.get<{ status: number; result: { data: AppNotification[]; meta: { total: number; unread: number; current_page: number; last_page: number; per_page: number } } }>(
      '/v1/notifications', { params: { page, per_page: perPage } },
    ),

  markAsRead: (id: string) =>
    api.patch(`/v1/notifications/${id}/read`),

  markAllAsRead: () =>
    api.patch('/v1/notifications/read-all'),

  destroy: (id: string) =>
    api.delete(`/v1/notifications/${id}`),
};
