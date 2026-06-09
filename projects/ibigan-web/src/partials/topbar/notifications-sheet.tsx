import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, LoaderCircle, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { notificationsService, type AppNotification } from '@/services/notifications.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

function getNotificationTitle(notification: AppNotification): string {
  const data = notification.data;
  const type = notification.type.split('\\').pop() ?? '';

  if (data.subject) return String(data.subject);
  if (data.user_name) return `Usuário ${data.user_name} criado`;
  if (type === 'UserCreatedNotification') return 'Novo usuário criado';
  if (type === 'TemplateNotification') return String(data.subject ?? 'Nova mensagem');
  return 'Nova notificação';
}

function getNotificationBody(notification: AppNotification): string {
  const data = notification.data;
  if (data.body) {
    const body = String(data.body);
    return body.substring(0, 100) + (body.length > 100 ? '...' : '');
  }
  if (data.user_email) return String(data.user_email);
  return '';
}

export function NotificationsSheet({ trigger }: { trigger: ReactNode }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list(),
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Todas marcadas como lidas.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsService.destroy(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data.result.data ?? [];
  const unread = data?.data.result.meta.unread
    ?? notifications.filter((n) => !n.read_at).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          {trigger}
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px] bg-destructive">
              {unread > 9 ? '9+' : unread}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="p-0 gap-0 sm:w-[420px] sm:max-w-none inset-5 start-auto h-auto rounded-lg [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="px-5 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="size-4" />
              Notificações
              {unread > 0 && (
                <Badge variant="destructive" className="text-xs">{unread} novas</Badge>
              )}
            </SheetTitle>
            {unread > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                <CheckCheck className="size-4 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </SheetHeader>

        <SheetBody className="p-0">
          <ScrollArea className="h-[500px]">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Bell className="size-8 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex gap-3 px-5 py-4 hover:bg-muted/50 transition-colors',
                      !n.read_at && 'bg-primary/5',
                    )}
                  >
                    <div className={cn(
                      'size-2 rounded-full mt-2 shrink-0',
                      n.read_at ? 'bg-muted-foreground/30' : 'bg-primary',
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm', !n.read_at && 'font-medium')}>
                        {getNotificationTitle(n)}
                      </p>
                      {getNotificationBody(n) && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {getNotificationBody(n)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {!n.read_at && (
                        <Button
                          variant="ghost"
                          mode="icon"
                          size="sm"
                          className="size-7"
                          onClick={() => markAsReadMutation.mutate(n.id)}
                        >
                          <Check className="size-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        mode="icon"
                        size="sm"
                        className="size-7"
                        onClick={() => deleteMutation.mutate(n.id)}
                      >
                        <Trash2 className="size-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="border-t px-5 py-3">
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
