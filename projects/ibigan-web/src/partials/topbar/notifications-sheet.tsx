import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { notificationsService } from '@/services/notifications.service';
import { NotificationItem } from '@/partials/topbar/notifications/notification-item';
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
      <SheetContent className="p-0 gap-0 sm:w-[500px] sm:max-w-none inset-5 start-auto h-auto rounded-lg [&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="mb-0 px-5 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 p-0">
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

        <SheetBody className="grow p-0">
          <ScrollArea className="h-[calc(100vh-10.5rem)]">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Bell className="size-10 mb-2 opacity-30" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              <div className="flex flex-col gap-0 py-2">
                {notifications.map((n, index) => (
                  <div key={n.id}>
                    <NotificationItem
                      notification={n}
                      onMarkRead={(id) => markAsReadMutation.mutate(id)}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                    {index < notifications.length - 1 && (
                      <div className="border-b border-border mx-5" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="border-t border-border p-5">
          <Button variant="outline" size="sm" className="w-full" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
