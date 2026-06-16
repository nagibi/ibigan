import api from '@/lib/axios';
import {
  dateRangeFilterFromKey,
  dateRangeFilterToKey,
} from '@/hooks/use-grid-filters';

export interface AppNotification {
  id: string;
  record_id?: number;
  type: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export type NotificationQuickFilter = 'all' | 'unread' | 'read' | 'reports';

export interface NotificationListParams {
  page?: number;
  perPage?: number;
  search?: string;
  quickFilter?: NotificationQuickFilter;
  columnFilters?: Record<string, string>;
}

function buildListParams({
  page = 1,
  perPage = 15,
  search,
  quickFilter = 'all',
  columnFilters = {},
}: NotificationListParams = {}): Record<string, string | number> {
  const params: Record<string, string | number> = { page, per_page: perPage };

  if (search?.trim()) {
    params.search = search.trim();
  }

  const readStatus = columnFilters.read_status?.trim();
  if (readStatus) {
    params.filter_read_status = readStatus;
  } else if (quickFilter === 'unread') {
    params.filter_read_status = 'unread';
  } else if (quickFilter === 'read') {
    params.filter_read_status = 'read';
  }

  if (quickFilter === 'reports') {
    params.filter_type = 'report';
  }

  for (const [key, value] of Object.entries(columnFilters)) {
    if (!value.trim() || key === 'read_status') continue;

    if (key === 'created_at_from' || key === 'created_at_to') {
      params[key] = value;
      continue;
    }

    params[`filter_${key}`] = value;
  }

  return params;
}

export const notificationsService = {
  list: (options: NotificationListParams = {}) =>
    api.get<{ status: number; result: { data: AppNotification[]; meta: { total: number; unread: number; current_page: number; last_page: number; per_page: number } } }>(
      '/v1/notifications',
      { params: buildListParams(options) },
    ),

  listFilterKeys: {
    readStatus: 'read_status',
    title: 'title',
    id: 'id',
    createdAt: 'created_at',
    createdAtFrom: dateRangeFilterFromKey('created_at'),
    createdAtTo: dateRangeFilterToKey('created_at'),
  },

  markAsRead: (id: string) =>
    api.patch<{ status: number; result: AppNotification }>(`/v1/notifications/${id}/read`),

  markAsUnread: (id: string) =>
    api.patch<{ status: number; result: AppNotification }>(`/v1/notifications/${id}/unread`),

  markAllAsRead: () =>
    api.patch('/v1/notifications/read-all'),

  destroy: (id: string) =>
    api.delete(`/v1/notifications/${id}`),
};
