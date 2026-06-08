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
      [key: string]: unknown;
    }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast.info('Nova notificação', {
        description: notification.user_name
          ? `Usuário ${notification.user_name} criado`
          : 'Você tem uma nova notificação',
      });
    });

    return () => {
      echo.leave(`App.Models.User.${user.id}`);
    };
  }, [user?.id, isAuthenticated, queryClient]);
}
