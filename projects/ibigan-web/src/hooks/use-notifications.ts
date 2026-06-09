import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { getEcho } from '@/lib/echo';

export function useNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !isAuthenticated) return;

    const echo = getEcho();
    const channel = echo.private(`App.Models.User.${user.id}`);

    channel.notification((notification: {
      type: string;
      user_name?: string;
      template_name?: string;
      rows_count?: number;
      subject?: string;
      [key: string]: unknown;
    }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      const type = notification.type?.split('\\').pop() ?? '';

      if (type === 'ReportCompletedNotification') {
        toast.success('Relatório pronto', {
          description: `${notification.template_name ?? 'Relatório'} — ${notification.rows_count ?? 0} registros`,
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
      echo.leave(`App.Models.User.${user.id}`);
    };
  }, [user?.id, isAuthenticated, queryClient]);
}
