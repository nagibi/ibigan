import { useQuery } from '@tanstack/react-query';
import { useCentralOnlySession } from '@/hooks/use-central-only-session';
import { notificationsService } from '@/services/notifications.service';

export function useNotificationsList(open: boolean) {
  const isCentralOnly = useCentralOnlySession();

  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list(),
    refetchInterval: open ? 30000 : false,
    enabled: !isCentralOnly,
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
