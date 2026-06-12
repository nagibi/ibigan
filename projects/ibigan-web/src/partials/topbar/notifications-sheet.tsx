import { Fragment, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationPreferencesSheet } from '@/providers/notification-preferences-sheet-provider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart2, Bell, CheckCheck, ExternalLink, LoaderCircle, Settings } from 'lucide-react';
import { toast } from 'sonner';
import {
  invalidateNotifications,
  markAllNotificationsReadInCache,
  removeNotificationFromCache,
  upsertNotificationInCache,
} from '@/lib/notification-cache';
import { useCentralOnlySession } from '@/hooks/use-central-only-session';
import { notificationsService } from '@/services/notifications.service';
import { isReportNotification } from '@/lib/notification-utils';
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
  const isCentralOnly = useCentralOnlySession();
  const { open: openPreferences } = useNotificationPreferencesSheet();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsService.list(),
    refetchInterval: open ? 30000 : false,
    enabled: !isCentralOnly,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: (response) => {
      upsertNotificationInCache(queryClient, response.data.result);
    },
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsUnread(id),
    onSuccess: (response) => {
      upsertNotificationInCache(queryClient, response.data.result);
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      markAllNotificationsReadInCache(queryClient);
      toast.success('Todas marcadas como lidas.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsService.destroy(id),
    onSuccess: (_response, id) => {
      removeNotificationFromCache(queryClient, id);
      void invalidateNotifications(queryClient);
    },
  });

  const notifications = data?.data.result.data ?? [];
  const unread = data?.data.result.meta.unread
    ?? notifications.filter((notification) => !notification.read_at).length;
  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.read_at),
    [notifications],
  );
  const reportNotifications = useMemo(
    () => notifications.filter(isReportNotification),
    [notifications],
  );
  const unreadReportNotifications = useMemo(
    () => reportNotifications.filter((notification) => !notification.read_at),
    [reportNotifications],
  );

  if (isCentralOnly) {
    return null;
  }

  function renderNotifications(items: typeof notifications, emptyLabel = 'Nenhuma notificação') {
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
          <p className="text-sm">{emptyLabel}</p>
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
              onMarkUnread={(id) => markAsUnreadMutation.mutate(id)}
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
          <SheetTitle className="p-0">Notificações</SheetTitle>
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
                <TabsTrigger value="reports" className="relative gap-1.5">
                  <BarChart2 className="size-3.5" />
                  Relatórios
                  {unreadReportNotifications.length > 0 && (
                    <span className="absolute -end-1 top-1 size-1.5 rounded-full bg-green-500" />
                  )}
                </TabsTrigger>
                <div className="flex grow items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    mode="icon"
                    className="mb-1"
                    onClick={() => {
                      setOpen(false);
                      openPreferences();
                    }}
                  >
                    <Settings className="size-4.5!" />
                  </Button>
                </div>
              </TabsList>

              <TabsContent value="all" className="mt-0">
                {renderNotifications(notifications)}
              </TabsContent>

              <TabsContent value="unread" className="mt-0">
                {renderNotifications(unreadNotifications, 'Nenhuma notificação não lida')}
              </TabsContent>

              <TabsContent value="reports" className="mt-0">
                <div className="mb-4 flex items-center justify-between gap-2 px-5">
                  <p className="text-xs text-muted-foreground">
                    Relatórios concluídos com download direto.
                  </p>
                  <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                    <Link to="/reports/executions" onClick={() => setOpen(false)}>
                      <ExternalLink className="mr-1 size-3" />
                      Ver execuções
                    </Link>
                  </Button>
                </div>
                {renderNotifications(reportNotifications, 'Nenhuma notificação de relatório')}
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
                  void invalidateNotifications(queryClient);
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
