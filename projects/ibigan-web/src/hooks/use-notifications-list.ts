import { useQuery } from '@tanstack/react-query';
import { notificationsService } from '@/services/notifications.service';
import { useAuthStore } from '@/stores/auth.store';

export function useNotificationsList(open: boolean) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list(),
    refetchInterval: open ? 30000 : false,
    enabled: isAuthenticated,
  });
}

export function useNotificationsUnreadCount(isOpen: boolean) {
  const { data } = useNotificationsList(isOpen);
  const notifications = data?.data.result.data ?? [];

  return (
    data?.data.result.meta.unread ??
    notifications.filter((notification) => !notification.read_at).length
  );
}
