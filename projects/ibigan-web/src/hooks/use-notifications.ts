import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  invalidateNotifications,
  upsertNotificationInCache,
} from '@/lib/notification-cache';
import { getEcho } from '@/lib/echo';
import { showAlertToast } from '@/lib/show-alert-toast';
import { type AppNotification } from '@/services/notifications.service';
import { useAuthStore } from '@/stores/auth.store';

export function useNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !isAuthenticated) return;

    const echo = getEcho();
    const channel = echo.private(`App.Models.User.${user.id}`);

    const onNotificationUpdated = (notification: AppNotification) => {
      upsertNotificationInCache(queryClient, notification);
    };

    const onNotificationsInvalidated = () => {
      void invalidateNotifications(queryClient);
    };

    channel.listen('.notification.updated', onNotificationUpdated);
    channel.listen('.notifications.invalidated', onNotificationsInvalidated);

    channel.notification((notification: {
      type: string;
      user_name?: string;
      template_name?: string;
      rows_count?: number;
      subject?: string;
      [key: string]: unknown;
    }) => {
      void invalidateNotifications(queryClient);

      const type = notification.type?.split('\\').pop() ?? '';

      if (type === 'ReportCompletedNotification') {
        const templateName = notification.template_name ?? 'Relatório';
        const rowsCount = notification.rows_count ?? 0;
        const records = rowsCount === 1 ? '1 registro' : `${rowsCount} registros`;

        showAlertToast({
          title: 'Relatório pronto',
          description: `${templateName} — ${records}`,
          variant: 'success',
        });
        return;
      }

      if (type === 'UserCreatedNotification' && notification.user_name) {
        toast.info('Novo usuário', {
          description: `${notification.user_name} foi criado`,
        });
        return;
      }

      if (notification.subject) {
        toast.info(String(notification.subject), {
          description: notification.body ? String(notification.body).substring(0, 80) : undefined,
        });
        return;
      }

      toast.info('Nova notificação');
    });

    return () => {
      channel.stopListening('.notification.updated', onNotificationUpdated);
      channel.stopListening('.notifications.invalidated', onNotificationsInvalidated);
      echo.leave(`App.Models.User.${user.id}`);
    };
  }, [user?.id, isAuthenticated, queryClient]);
}
