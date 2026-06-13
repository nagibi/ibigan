import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart2, Check, CheckCheck, Download, ExternalLink, Eye, MailOpen, Settings, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { resolveMenuIcon } from '@/lib/menu-icons';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useApiMenuByPath } from '@/hooks/use-api-menu-by-path';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import {
  dateRangeFilterFromKey,
  dateRangeFilterToKey,
  useGridFilters,
} from '@/hooks/use-grid-filters';
import {
  getNotificationTitle,
  getNotificationType,
  getReportDownloadMeta,
  isReportNotification,
} from '@/lib/notification-utils';
import {
  invalidateNotifications,
  markAllNotificationsReadInCache,
  removeNotificationFromCache,
  upsertNotificationInCache,
} from '@/lib/notification-cache';
import {
  notificationsService,
  type AppNotification,
  type NotificationQuickFilter,
} from '@/services/notifications.service';
import { useNotificationPreferencesSheet } from '@/providers/notification-preferences-sheet-provider';
import { downloadReportResultCsvWithToast } from '@/services/reports.service';
import { NotificationDetailSheet } from '@/components/notifications/notification-detail-sheet';
import { PageBody } from '@/components/common/page-body';
import { formatDateRangeFilterLabel } from '@/components/grid/grid-date-range-filter';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination } from '@/components/grid/grid-pagination';
import { GridQuickFilters } from '@/components/grid/grid-quick-filters';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridTable } from '@/components/grid/grid-table';
import {
  GridPanelToolbar,
  GridToolbarButton,
  GridToolbarGroup,
  StandardGridToolbar,
} from '@/components/grid/grid-toolbar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

const READ_STATUS_FILTER_OPTIONS = [
  { label: 'Lida', value: 'read' },
  { label: 'Não lida', value: 'unread' },
];

export function NotificationsPage() {
  const navigate = useNavigate();
  const { open: openPreferences } = useNotificationPreferencesSheet();
  const notificationsMenu = useApiMenuByPath('/notifications');
  const notificationPreferencesMenu = useApiMenuByPath('/notification-preferences');
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useApiToolbarAlert();
  const grid = useGrid();
  const columnFilters = useGridFilters(() => grid.setPage(1));
  const [activeFilter, setActiveFilter] = useState<NotificationQuickFilter>('all');
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [viewingNotification, setViewingNotification] = useState<AppNotification | null>(null);
  const selectedRef = useRef<string[]>([]);
  selectedRef.current = selected;

  const [knownTotal, setKnownTotal] = useState(0);

  const listParams = useMemo(
    () => ({
      page: grid.page,
      perPage: grid.resolvePerPage(knownTotal),
      search: grid.debouncedSearch,
      quickFilter: activeFilter,
      columnFilters: columnFilters.activeFilterParams,
    }),
    [
      activeFilter,
      columnFilters.activeFilterParams,
      grid.debouncedSearch,
      grid.page,
      grid.perPage,
      grid.resolvePerPage,
      knownTotal,
    ],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['notifications', listParams],
    queryFn: () => notificationsService.list(listParams),
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

  useEffect(() => {
    if (meta.total > 0) {
      setKnownTotal(meta.total);
    }
  }, [meta.total]);

  const reportCount = useMemo(
    () => notifications.filter(isReportNotification).length,
    [notifications],
  );
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  );
  const readCount = useMemo(
    () => notifications.filter((notification) => Boolean(notification.read_at)).length,
    [notifications],
  );

  const PreferencesIcon = notificationPreferencesMenu
    ? resolveMenuIcon({
      icon: notificationPreferencesMenu.icon,
      path: notificationPreferencesMenu.path,
      slug: notificationPreferencesMenu.slug,
      title: notificationPreferencesMenu.title,
    })
    : Settings;

  const activeViewNotification = useMemo(() => {
    if (!viewingNotification) return null;
    return notifications.find((item) => item.id === viewingNotification.id) ?? viewingNotification;
  }, [notifications, viewingNotification]);

  const syncViewingNotification = useCallback((notification: AppNotification) => {
    setViewingNotification((current) => (
      current?.id === notification.id ? notification : current
    ));
  }, []);

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: (response) => {
      const updated = response.data.result;
      upsertNotificationInCache(queryClient, updated);
      syncViewingNotification(updated);
    },
    onError: (error) => showError('Erro ao marcar notificação como lida.', error),
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markAsUnread(id),
    onSuccess: (response) => {
      const updated = response.data.result;
      upsertNotificationInCache(queryClient, updated);
      syncViewingNotification(updated);
    },
    onError: (error) => showError('Erro ao marcar notificação como não lida.', error),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      markAllNotificationsReadInCache(queryClient);
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
      await downloadReportResultCsvWithToast(templateId, executionId, templateName);
      if (!notification.read_at) {
        const response = await notificationsService.markAsRead(notification.id);
        upsertNotificationInCache(queryClient, response.data.result);
      }
    } catch {
      // Toast de erro já exibido pelo helper de download.
    } finally {
      setDownloadingId(null);
    }
  }, [queryClient, showError]);

  const handleMarkSelectedRead = useCallback(async () => {
    const ids = selectedRef.current;
    if (ids.length === 0) return;

    try {
      const responses = await Promise.all(ids.map((id) => notificationsService.markAsRead(id)));
      responses.forEach((response) => {
        upsertNotificationInCache(queryClient, response.data.result);
      });
      showSuccess(ids.length === 1 ? 'Notificação marcada como lida.' : 'Notificações marcadas como lidas.');
      clearSelection();
    } catch (error) {
      showError('Erro ao marcar notificações.', error);
      void invalidateNotifications(queryClient);
    }
  }, [clearSelection, queryClient, showError, showSuccess]);

  const handleMarkSelectedUnread = useCallback(async () => {
    const ids = selectedRef.current;
    if (ids.length === 0) return;

    try {
      const responses = await Promise.all(ids.map((id) => notificationsService.markAsUnread(id)));
      responses.forEach((response) => {
        upsertNotificationInCache(queryClient, response.data.result);
      });
      showSuccess(
        ids.length === 1
          ? 'Notificação marcada como não lida.'
          : 'Notificações marcadas como não lidas.',
      );
      clearSelection();
    } catch (error) {
      showError('Erro ao marcar notificações.', error);
      void invalidateNotifications(queryClient);
    }
  }, [clearSelection, queryClient, showError, showSuccess]);

  const handleViewNotification = useCallback((notification: AppNotification) => {
    setViewingNotification(notification);
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteIds.length === 0) return;
    try {
      setIsDeleting(true);
      await Promise.all(deleteIds.map((id) => {
        removeNotificationFromCache(queryClient, id);
        return notificationsService.destroy(id);
      }));
      void invalidateNotifications(queryClient);
      showSuccess(deleteIds.length === 1 ? 'Notificação removida.' : 'Notificações removidas.');
      setDeleteIds([]);
      clearSelection();
    } catch (error) {
      showError('Erro ao remover notificações.', error);
    } finally {
      setIsDeleting(false);
    }
  }, [clearSelection, deleteIds, queryClient, showError, showSuccess]);

  const visibleIds = notifications.map((notification) => notification.id);
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
        filter: { type: 'multi', filterKey: 'id', placeholder: 'ID' },
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
              {
                label: 'Visualizar',
                icon: Eye,
                onClick: () => handleViewNotification(notification),
              },
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
        filter: { type: 'text', filterKey: 'title', placeholder: 'Notificação' },
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
        id: 'read',
        label: 'Status',
        className: 'w-[80px]',
        filter: {
          type: 'select',
          filterKey: 'read_status',
          placeholder: 'Status',
          options: READ_STATUS_FILTER_OPTIONS,
        },
        render: (notification) => {
          const isToggling = (
            (markAsReadMutation.isPending && markAsReadMutation.variables === notification.id)
            || (markAsUnreadMutation.isPending && markAsUnreadMutation.variables === notification.id)
          );

          return (
            <div
              className="flex justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              <Switch
                size="sm"
                checked={Boolean(notification.read_at)}
                disabled={isToggling}
                onCheckedChange={(checked) => {
                  if (checked) {
                    markAsReadMutation.mutate(notification.id);
                  } else {
                    markAsUnreadMutation.mutate(notification.id);
                  }
                }}
              />
            </div>
          );
        },
      },
      {
        id: 'created_at',
        label: 'Recebida',
        className: 'w-[140px] text-sm text-muted-foreground',
        filter: { type: 'dateRange', filterKey: 'created_at', placeholder: 'Período' },
        render: (notification) => formatDistanceToNow(new Date(notification.created_at), {
          addSuffix: true,
          locale: ptBR,
        }),
      },
    ],
    [downloadingId, handleDownloadReport, handleViewNotification, markAsReadMutation, markAsUnreadMutation, navigate, selected, toggleSelect],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const activeFilters = useMemo(() => {
    const items = [];

    if (grid.search.trim()) {
      items.push({
        id: 'search',
        label: 'Busca',
        value: grid.search.trim(),
        onRemove: grid.clearSearch,
      });
    }

    for (const column of columnDefinitions) {
      if (!column.filter) continue;

      if (column.filter.type === 'dateRange') {
        const from = columnFilters.filters[dateRangeFilterFromKey(column.filter.filterKey)]?.trim() ?? '';
        const to = columnFilters.filters[dateRangeFilterToKey(column.filter.filterKey)]?.trim() ?? '';
        if (!from && !to) continue;

        items.push({
          id: column.filter.filterKey,
          label: column.label,
          value: formatDateRangeFilterLabel(from, to),
          onRemove: () => columnFilters.clearDateRangeFilter(column.filter!.filterKey),
        });
        continue;
      }

      const value = columnFilters.filters[column.filter.filterKey]?.trim();
      if (!value) continue;

      const displayValue =
        column.filter.type === 'select'
          ? column.filter.options?.find((option) => option.value === value)?.label ?? value
          : column.filter.type === 'multi'
            ? parseMultiFilterValue(value).join(', ')
            : value;

      items.push({
        id: column.filter.filterKey,
        label: column.label,
        value: displayValue,
        onRemove: () => columnFilters.clearFilter(column.filter!.filterKey),
      });
    }

    return items;
  }, [
    columnDefinitions,
    columnFilters.clearDateRangeFilter,
    columnFilters.clearFilter,
    columnFilters.filters,
    grid.clearSearch,
    grid.search,
  ]);

  const handleClearFilters = useCallback(() => {
    grid.clearSearch();
    columnFilters.clearAllFilters();
    showSuccess('Filtros removidos.');
  }, [columnFilters, grid, showSuccess]);

  const handleFilterChange = useCallback((value: NotificationQuickFilter) => {
    setActiveFilter(value);
    clearSelection();
    grid.setPage(1);
  }, [clearSelection, grid]);

  const handleResetGrid = useCallback(() => {
    gridColumns.resetColumns();
    grid.resetSettings();
    columnFilters.clearAllFilters();
    setActiveFilter('all');
    clearSelection();
    showSuccess('Grid restaurado ao padrão.');
  }, [clearSelection, columnFilters, grid, gridColumns, showSuccess]);

  const isGridCustomized = grid.isCustomized
    || gridColumns.isCustomized
    || columnFilters.hasFilters
    || activeFilter !== 'all';

  usePageToolbar({
    title: notificationsMenu?.title ?? 'Minhas notificações',
    description: 'Central de notificações do sistema.',
    actions: (
      <StandardGridToolbar
        onDelete={() => selectedRef.current.length > 0 && setDeleteIds([...selectedRef.current])}
        hasSelection={selected.length > 0}
        extra={(
          <GridToolbarGroup>
            <GridToolbarButton
              label="Marcar todas como lidas"
              icon={CheckCheck}
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending || meta.unread === 0}
              loading={markAllMutation.isPending}
            />
            <GridToolbarButton
              label="Marcar selecionadas como lidas"
              icon={Check}
              onClick={() => void handleMarkSelectedRead()}
              disabled={selected.length === 0}
            />
            <GridToolbarButton
              label="Marcar selecionadas como não lidas"
              icon={MailOpen}
              onClick={() => void handleMarkSelectedUnread()}
              disabled={selected.length === 0}
            />
            {activeFilter === 'reports' && (
              <Button variant="outline" size="sm" className="h-8" asChild>
                <Link to="/reports/executions">
                  <ExternalLink className="mr-1 size-3.5" />
                  Ver execuções
                </Link>
              </Button>
            )}
          </GridToolbarGroup>
        )}
      />
    ),
  });

  const emptyMessage = activeFilter === 'reports'
    ? 'Nenhuma notificação de relatório encontrada.'
    : activeFilter === 'unread'
      ? 'Nenhuma notificação não lida encontrada.'
      : activeFilter === 'read'
        ? 'Nenhuma notificação lida encontrada.'
        : 'Nenhuma notificação encontrada.';

  return (
    <PageBody>
      <GridPanel
        header={(
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              {notificationsMenu?.title ?? 'Minhas notificações'}
            </h2>
            <Button
              variant="primary"
              size="sm"
              className="h-8 shrink-0"
              onClick={openPreferences}
            >
              <PreferencesIcon className="mr-1.5 size-3.5" />
              Configurações
            </Button>
          </div>
        )}
        toolbar={(
          <GridPanelToolbar
            onSelectAll={() => toggleSelectAll(visibleIds)}
            isAllSelected={allVisibleSelected}
            selectedCount={selected.length}
            onClearSelection={clearSelection}
            onRefresh={() => void invalidateNotifications(queryClient)}
            isRefreshing={isLoading || isFetching}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder="Buscar notificações..."
            filters={{
              active: activeFilters,
              onClearAll: activeFilters.length > 0 ? handleClearFilters : undefined,
              columnFilters: {
                columns: gridColumns.visibleColumns,
                values: columnFilters.filters,
                onFilterChange: columnFilters.setFilter,
                onDateRangeChange: columnFilters.setDateRangeFilter,
                onFilterClear: columnFilters.clearColumnFilter,
              },
            }}
            columnsControl={(
              <GridColumnsControl
                columns={columnDefinitions}
                order={gridColumns.order}
                hidden={gridColumns.hidden}
                visibleCount={gridColumns.visibleCount}
                totalCount={gridColumns.totalCount}
                isCustomized={gridColumns.isCustomized}
                onOrderChange={gridColumns.setColumnOrder}
                onSetVisibility={gridColumns.setColumnVisibility}
                canHideColumn={gridColumns.canHideColumn}
                onShowAll={gridColumns.showAllColumns}
                onHideAll={gridColumns.hideAllColumns}
                onResetDefault={gridColumns.resetColumns}
              />
            )}
            resetControl={(
              <GridResetControl
                disabled={!isGridCustomized}
                onReset={handleResetGrid}
              />
            )}
            quickFiltersControl={(
              <GridQuickFilters
                value={activeFilter}
                onChange={handleFilterChange}
                defaultValue="all"
                options={[
                  { value: 'all', label: 'Todas', count: notifications.length },
                  { value: 'unread', label: 'Não lidas', count: unreadCount },
                  { value: 'read', label: 'Lidas', count: readCount },
                  { value: 'reports', label: 'Relatórios', icon: BarChart2, count: reportCount },
                ]}
              />
            )}
            recordCount={{ total: knownTotal || meta.total }}
          />
        )}
        footer={(
          <GridPagination
            meta={meta}
            perPage={grid.perPage}
            onPageChange={grid.setPage}
            onPerPageChange={grid.setPerPage}
          />
        )}
      >
        <GridTable
          columns={gridColumns.visibleColumns}
          data={notifications}
          getRowKey={(notification) => notification.id}
          loading={isLoading}
          emptyMessage={emptyMessage}
          onColumnOrderChange={gridColumns.reorderDraggableColumns}
          isRowSelected={(notification) => selected.includes(notification.id)}
          onRowClick={handleViewNotification}
          columnFilters={columnFilters.filters}
          onColumnFilterChange={columnFilters.setFilter}
          onDateRangeFilterChange={columnFilters.setDateRangeFilter}
          onColumnFilterClear={columnFilters.clearColumnFilter}
        />
      </GridPanel>

      <NotificationDetailSheet
        notification={activeViewNotification}
        open={activeViewNotification !== null}
        onOpenChange={(open) => {
          if (!open) setViewingNotification(null);
        }}
        onMarkRead={(id) => markAsReadMutation.mutate(id)}
        onMarkUnread={(id) => markAsUnreadMutation.mutate(id)}
        onDelete={(id) => setDeleteIds([id])}
      />

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
