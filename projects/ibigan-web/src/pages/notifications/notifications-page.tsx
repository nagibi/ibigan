import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart2, Check, CheckCheck, Download, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import {
  getNotificationTitle,
  getNotificationType,
  getReportDownloadMeta,
  isReportNotification,
} from '@/lib/notification-utils';
import { notificationsService, type AppNotification } from '@/services/notifications.service';
import { downloadReportResultCsv } from '@/services/reports.service';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination } from '@/components/grid/grid-pagination';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridTable } from '@/components/grid/grid-table';
import {
  GridPanelToolbar,
  GridToolbarButton,
  GridToolbarGroup,
  GridToolbarRoot,
} from '@/components/grid/grid-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const GRID_COLUMNS_KEY = 'grid-columns:notifications';

type NotificationTab = 'all' | 'reports';

export function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useApiToolbarAlert();
  const grid = useGrid();
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notifications', grid.page, grid.perPage],
    queryFn: () => notificationsService.list(grid.page, grid.perPage),
    refetchInterval: 30000,
  });

  const notifications = data?.data.result.data ?? [];
  const meta = data?.data.result.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: grid.perPage,
    total: 0,
    unread: 0,
  };

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelected([]);
      showSuccess('Todas marcadas como lidas.');
    },
    onError: (error) => showError('Erro ao marcar notificações.', error),
  });

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  const clearSelection = useCallback(() => setSelected([]), []);

  const toggleSelectAll = useCallback((ids: string[]) => {
    setSelected((prev) => (prev.length === ids.length ? [] : ids));
  }, []);

  const handleDownloadReport = useCallback(async (notification: AppNotification) => {
    const { templateId, executionId, templateName } = getReportDownloadMeta(notification);
    if (!templateId || !executionId) {
      showError('Dados do relatório indisponíveis.');
      return;
    }

    try {
      setDownloadingId(notification.id);
      await downloadReportResultCsv(templateId, executionId, templateName);
      if (!notification.read_at) {
        await notificationsService.markAsRead(notification.id);
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
      showSuccess('Download iniciado.');
    } catch {
      showError('Erro ao baixar relatório.');
    } finally {
      setDownloadingId(null);
    }
  }, [queryClient, showError, showSuccess]);

  const handleMarkSelectedRead = useCallback(async () => {
    if (selected.length === 0) return;
    try {
      await Promise.all(selected.map((id) => notificationsService.markAsRead(id)));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showSuccess(selected.length === 1 ? 'Notificação marcada como lida.' : 'Notificações marcadas como lidas.');
      clearSelection();
    } catch (error) {
      showError('Erro ao marcar notificações.', error);
    }
  }, [clearSelection, queryClient, selected, showError, showSuccess]);

  const handleDelete = useCallback(async () => {
    if (deleteIds.length === 0) return;
    try {
      setIsDeleting(true);
      await Promise.all(deleteIds.map((id) => notificationsService.destroy(id)));
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showSuccess(deleteIds.length === 1 ? 'Notificação removida.' : 'Notificações removidas.');
      setDeleteIds([]);
      clearSelection();
    } catch (error) {
      showError('Erro ao remover notificações.', error);
    } finally {
      setIsDeleting(false);
    }
  }, [clearSelection, deleteIds, queryClient, showError, showSuccess]);

  const tabNotifications = useMemo(() => {
    const base = activeTab === 'reports'
      ? notifications.filter(isReportNotification)
      : notifications;

    const q = grid.debouncedSearch.trim().toLowerCase();
    if (!q) return base;

    return base.filter((notification) =>
      getNotificationTitle(notification).toLowerCase().includes(q)
      || getNotificationType(notification).toLowerCase().includes(q),
    );
  }, [activeTab, grid.debouncedSearch, notifications]);

  const visibleIds = tabNotifications.map((notification) => notification.id);
  const allVisibleSelected = visibleIds.length > 0
    && visibleIds.every((id) => selected.includes(id));

  const columnDefinitions = useMemo<GridColumnDef<AppNotification>[]>(
    () => [
      {
        id: 'select',
        label: '#',
        pinned: 'start',
        hideable: false,
        className: 'w-[40px]',
        render: (notification) => (
          <Checkbox
            checked={selected.includes(notification.id)}
            onCheckedChange={() => toggleSelect(notification.id)}
            onClick={(event) => event.stopPropagation()}
          />
        ),
      },
      {
        id: 'id',
        label: 'Id',
        className: 'w-[70px] text-sm text-muted-foreground',
        render: (notification) => notification.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'w-[72px]',
        render: (notification) => (
          <GridRowActions
            actions={[
              ...(isReportNotification(notification)
                ? [
                    {
                      label: 'Baixar CSV',
                      icon: Download,
                      onClick: () => void handleDownloadReport(notification),
                      disabled: downloadingId === notification.id,
                    },
                    {
                      label: 'Ver execuções',
                      icon: ExternalLink,
                      onClick: () => navigate('/reports/executions'),
                    },
                  ]
                : []),
              ...(!notification.read_at
                ? [{
                    label: 'Marcar como lida',
                    icon: Check,
                    onClick: () => markAsReadMutation.mutate(notification.id),
                  }]
                : []),
              {
                label: 'Remover',
                icon: Trash2,
                tone: 'destructive' as const,
                onClick: () => setDeleteIds([notification.id]),
              },
            ]}
          />
        ),
      },
      {
        id: 'title',
        label: 'Notificação',
        className: 'min-w-[240px]',
        render: (notification) => (
          <div className="min-w-0">
            <p className={`truncate text-sm ${notification.read_at ? 'text-muted-foreground' : 'font-medium'}`}>
              {getNotificationTitle(notification)}
            </p>
            <p className="text-xs text-muted-foreground">
              {isReportNotification(notification) ? 'Relatórios' : getNotificationType(notification)}
            </p>
          </div>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        className: 'w-[100px]',
        render: (notification) => (
          <Badge variant={notification.read_at ? 'outline' : 'primary'}>
            {notification.read_at ? 'Lida' : 'Não lida'}
          </Badge>
        ),
      },
      {
        id: 'created_at',
        label: 'Recebida',
        className: 'w-[140px] text-sm text-muted-foreground',
        render: (notification) => formatDistanceToNow(new Date(notification.created_at), {
          addSuffix: true,
          locale: ptBR,
        }),
      },
    ],
    [downloadingId, handleDownloadReport, markAsReadMutation, navigate, selected, toggleSelect],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const toolbarActions = useMemo(
    () => (
      <GridToolbarRoot>
        <GridToolbarGroup>
          <GridToolbarButton
            label="Marcar todas como lidas"
            icon={CheckCheck}
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || meta.unread === 0}
            loading={markAllMutation.isPending}
          />
          <GridToolbarButton
            label="Marcar selecionadas"
            icon={Check}
            onClick={() => void handleMarkSelectedRead()}
            disabled={selected.length === 0}
          />
          <GridToolbarButton
            label="Remover selecionadas"
            icon={Trash2}
            tone="destructive"
            onClick={() => selected.length > 0 && setDeleteIds(selected)}
            disabled={selected.length === 0}
          />
          {activeTab === 'reports' && (
            <Button variant="outline" size="sm" className="h-8" asChild>
              <Link to="/reports/executions">
                <ExternalLink className="mr-1 size-3.5" />
                Ver execuções
              </Link>
            </Button>
          )}
        </GridToolbarGroup>
        <GridToolbarButton
          label="Atualizar"
          icon={RefreshCw}
          onClick={() => queryClient.invalidateQueries({ queryKey: ['notifications'] })}
          loading={isLoading || isFetching}
        />
      </GridToolbarRoot>
    ),
    [
      activeTab,
      handleMarkSelectedRead,
      isFetching,
      isLoading,
      markAllMutation,
      meta.unread,
      queryClient,
      selected.length,
    ],
  );

  usePageToolbar({
    title: 'Notificações',
    description: activeTab === 'reports'
      ? 'Notificações de relatórios com download direto e acesso às execuções.'
      : 'Central de notificações do sistema.',
    actions: toolbarActions,
  });

  return (
    <PageBody>
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as NotificationTab);
          clearSelection();
          grid.setPage(1);
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1.5">
            <BarChart2 className="size-3.5" />
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <GridPanel
            toolbar={(
              <GridPanelToolbar
                onSelectAll={() => toggleSelectAll(visibleIds)}
                isAllSelected={allVisibleSelected}
                selectedCount={selected.length}
                onClearSelection={clearSelection}
                onRefresh={() => queryClient.invalidateQueries({ queryKey: ['notifications'] })}
                isRefreshing={isLoading || isFetching}
                search={grid.search}
                onSearch={grid.setSearch}
                searchPlaceholder={activeTab === 'reports'
                  ? 'Buscar notificações de relatório...'
                  : 'Buscar notificações...'}
              />
            )}
            footer={(
              <GridPagination
                meta={meta}
                onPageChange={grid.setPage}
                onPerPageChange={grid.setPerPage}
              />
            )}
          >
            <GridTable
              columns={gridColumns.visibleColumns}
              data={tabNotifications}
              getRowKey={(notification) => notification.id}
              loading={isLoading}
              emptyMessage={activeTab === 'reports'
                ? 'Nenhuma notificação de relatório encontrada.'
                : 'Nenhuma notificação encontrada.'}
              onColumnOrderChange={gridColumns.reorderDraggableColumns}
              isRowSelected={(notification) => selected.includes(notification.id)}
              onRowClick={(notification) => {
                if (isReportNotification(notification) && !notification.read_at) {
                  markAsReadMutation.mutate(notification.id);
                }
              }}
            />
          </GridPanel>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteIds.length > 0} onOpenChange={(open) => !open && setDeleteIds([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remover {deleteIds.length === 1 ? 'notificação' : `${deleteIds.length} notificações`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageBody>
  );
}
