import { Fragment, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, LoaderCircle, Settings } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function NotificationsSheet({ trigger }: { trigger: ReactNode }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list(),
    refetchInterval: open ? 30000 : false,
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
    ?? notifications.filter((notification) => !notification.read_at).length;
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read_at),
    [notifications],
  );

  function renderNotifications(items: typeof notifications) {
    if (isLoading) {
      return (
        <div className="flex justify-center py-12">
          <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell className="mb-2 size-10 opacity-30" />
          <p className="text-sm">Nenhuma notificação</p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-5 overflow-y-auto pb-5">
        {items.map((notification, index) => (
          <Fragment key={notification.id}>
            <NotificationItem
              notification={notification}
              onMarkRead={(id) => markAsReadMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
            {index < items.length - 1 && <div className="border-b border-border" />}
          </Fragment>
        ))}
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          {trigger}
          {unread > 0 && (
            <Badge className="absolute -right-1 -top-1 flex size-5 items-center justify-center bg-destructive p-0 text-[10px]">
              {unread > 9 ? '9+' : unread}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="inset-5 start-auto h-auto w-full gap-0 rounded-lg p-0 sm:max-w-none sm:w-[500px] [&_[data-slot=sheet-close]]:end-5 [&_[data-slot=sheet-close]]:top-4.5">
        <SheetHeader className="mb-0 border-b px-5 py-4">
          <SheetTitle className="p-0">Notifications</SheetTitle>
        </SheetHeader>

        <SheetBody className="grow p-0">
          <ScrollArea className="h-[calc(100vh-10.5rem)]">
            <Tabs defaultValue="all" className="relative w-full">
              <TabsList variant="line" className="mb-5 w-full px-5">
                <TabsTrigger value="all">Todas</TabsTrigger>
                <TabsTrigger value="unread" className="relative">
                  Não lidas
                  {unread > 0 && (
                    <span className="absolute -end-1 top-1 size-1.5 rounded-full bg-green-500" />
                  )}
                </TabsTrigger>
                <div className="flex grow items-center justify-end">
                  <Button variant="ghost" size="sm" mode="icon" className="mb-1" asChild>
                    <Link to="/notification-preferences" onClick={() => setOpen(false)}>
                      <Settings className="size-4.5!" />
                    </Link>
                  </Button>
                </div>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                {renderNotifications(notifications)}
              </TabsContent>

              <TabsContent value="unread" className="mt-0">
                {renderNotifications(unreadNotifications)}
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="grid grid-cols-2 gap-2.5 border-t border-border p-5">
          <Button
            variant="outline"
            onClick={() => {
              const readIds = notifications.filter((notification) => notification.read_at).map((n) => n.id);
              if (readIds.length === 0) {
                toast.info('Nenhuma notificação lida para arquivar.');
                return;
              }
              Promise.all(readIds.map((id) => notificationsService.destroy(id)))
                .then(() => {
                  queryClient.invalidateQueries({ queryKey: ['notifications'] });
                  toast.success('Notificações lidas arquivadas.');
                })
                .catch(() => toast.error('Erro ao arquivar notificações.'));
            }}
          >
            Arquivar lidas
          </Button>
          <Button
            variant="outline"
            onClick={() => markAllMutation.mutate()}
            disabled={unread === 0 || markAllMutation.isPending}
          >
            <CheckCheck className="mr-1 size-4" />
            Marcar todas
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
