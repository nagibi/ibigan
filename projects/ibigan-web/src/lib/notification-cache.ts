import type { QueryClient } from '@tanstack/react-query';
import type { AppNotification } from '@/services/notifications.service';

type NotificationsListResponse = {
  data: {
    status: number;
    result: {
      data: AppNotification[];
      meta: {
        total: number;
        unread: number;
        current_page: number;
        last_page: number;
        per_page: number;
      };
    };
  };
};

function patchList(
  old: NotificationsListResponse | undefined,
  patch: (items: AppNotification[], meta: NotificationsListResponse['data']['result']['meta']) => {
    items: AppNotification[];
    meta: NotificationsListResponse['data']['result']['meta'];
  },
): NotificationsListResponse | undefined {
  if (!old?.data?.result) return old;

  const { items, meta } = patch(old.data.result.data, old.data.result.meta);

  return {
    ...old,
    data: {
      ...old.data,
      result: {
        ...old.data.result,
        data: items,
        meta,
      },
    },
  };
}

export function upsertNotificationInCache(
  queryClient: QueryClient,
  notification: AppNotification,
) {
  queryClient.setQueriesData<NotificationsListResponse>(
    { queryKey: ['notifications'] },
    (old) => patchList(old, (items, meta) => {
      const index = items.findIndex((item) => item.id === notification.id);
      const wasUnread = index >= 0 ? !items[index].read_at : !notification.read_at;
      const isUnread = !notification.read_at;
      let unreadDelta = 0;

      if (wasUnread && !isUnread) unreadDelta = -1;
      if (!wasUnread && isUnread) unreadDelta = 1;

      const nextItems = index >= 0
        ? items.map((item) => (item.id === notification.id ? notification : item))
        : [notification, ...items];

      return {
        items: nextItems,
        meta: {
          ...meta,
          unread: Math.max(0, (meta.unread ?? 0) + unreadDelta),
        },
      };
    }),
  );
}

export function removeNotificationFromCache(queryClient: QueryClient, id: string) {
  queryClient.setQueriesData<NotificationsListResponse>(
    { queryKey: ['notifications'] },
    (old) => patchList(old, (items, meta) => {
      const removed = items.find((item) => item.id === id);
      const nextItems = items.filter((item) => item.id !== id);

      return {
        items: nextItems,
        meta: {
          ...meta,
          total: Math.max(0, meta.total - 1),
          unread: removed && !removed.read_at
            ? Math.max(0, (meta.unread ?? 0) - 1)
            : meta.unread,
        },
      };
    }),
  );
}

export function markAllNotificationsReadInCache(queryClient: QueryClient) {
  queryClient.setQueriesData<NotificationsListResponse>(
    { queryKey: ['notifications'] },
    (old) => patchList(old, (items, meta) => ({
      items: items.map((item) => ({
        ...item,
        read_at: item.read_at ?? new Date().toISOString(),
      })),
      meta: {
        ...meta,
        unread: 0,
      },
    })),
  );
}

export function invalidateNotifications(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: ['notifications'] });
}
