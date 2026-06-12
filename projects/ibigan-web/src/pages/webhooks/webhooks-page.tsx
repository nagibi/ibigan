import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, LoaderCircle, Pencil, ScrollText, Trash2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { TOGGLE_ACTIVE_LABELS } from '@/lib/toggle-active-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import {
  dateRangeFilterFromKey,
  dateRangeFilterToKey,
  useGridFilters,
} from '@/hooks/use-grid-filters';
import {
  webhooksService,
  WEBHOOK_EVENTS,
  type Webhook,
  type WebhookDelivery,
} from '@/services/webhooks.service';
import { formatDateRangeFilterLabel } from '@/components/grid/grid-date-range-filter';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination, type GridPaginationMeta } from '@/components/grid/grid-pagination';
import { GridTable } from '@/components/grid/grid-table';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { GridBadge } from '@/components/grid/grid-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const GRID_COLUMNS_KEY = 'grid-columns:webhooks';

const STATUS_FILTER_OPTIONS = [
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
];

function formatCreatedAt(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), "dd/MM/yy 'às' HH:mm", { locale: ptBR });
}

function getEventLabel(event: string): string {
  return WEBHOOK_EVENTS.find((e) => e.value === event)?.label ?? event;
}

export function WebhooksPage() {
  const navigate = useNavigate();
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const { showSuccess, showToggleActive, showError, showInfo } = useApiToolbarAlert();

  const grid = useGrid({
    onActivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => webhooksService.toggleActive(id, true)));
        showToggleActive(true, TOGGLE_ACTIVE_LABELS.webhook, ids.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao ativar webhook(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
    onDeactivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => webhooksService.toggleActive(id, false)));
        showToggleActive(false, TOGGLE_ACTIVE_LABELS.webhook, ids.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao inativar webhook(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
  });

  const columnFilters = useGridFilters(() => grid.setPage(1));

  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [meta, setMeta] = useState<GridPaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowStatusId, setRowStatusId] = useState<number | null>(null);
  const [viewDeliveries, setViewDeliveries] = useState<Webhook | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await webhooksService.list(
        grid.page,
        grid.resolvePerPage(meta.total),
        grid.debouncedSearch,
        grid.sort,
        grid.sortDir,
        columnFilters.activeFilterParams,
      );
      setWebhooks(res.data.result.data);
      setMeta(res.data.result.meta);
    } catch (error) {
      showError('Erro ao carregar webhooks.', error);
    } finally {
      setLoading(false);
    }
  }, [
    grid.page,
    grid.perPage,
    grid.debouncedSearch,
    grid.sort,
    grid.sortDir,
    columnFilters.activeFilterParams,
    showError,
  ]);

  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!viewDeliveries) {
      setDeliveries([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setDeliveriesLoading(true);
        const res = await webhooksService.deliveries(viewDeliveries.id);
        if (!cancelled) {
          setDeliveries(res.data.result.data);
        }
      } catch (error) {
        if (!cancelled) {
          showError('Erro ao carregar logs de entrega.', error);
        }
      } finally {
        if (!cancelled) {
          setDeliveriesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewDeliveries, showError]);

  const handleEditSelected = useCallback(() => {
    if (!grid.singleSelection) return;
    navigate(`/webhooks/${grid.selected[0]}`);
  }, [grid.singleSelection, grid.selected, navigate]);

  const handleDeleteSelected = useCallback(() => {
    if (!grid.hasSelection) return;
    grid.requestDelete(grid.selected);
  }, [grid.hasSelection, grid.requestDelete, grid.selected]);

  const handleEscape = useCallback(() => {
    if (viewDeliveries !== null) {
      setViewDeliveries(null);
      return;
    }
    if (grid.deleteIds.length > 0) {
      grid.clearDeleteRequest();
    }
    if (grid.hasSelection) {
      grid.clearSelection();
    }
  }, [
    viewDeliveries,
    grid.clearDeleteRequest,
    grid.clearSelection,
    grid.deleteIds.length,
    grid.hasSelection,
  ]);

  useGridKeyboard({
    canEdit: grid.singleSelection,
    canDelete: grid.hasSelection,
    onEdit: handleEditSelected,
    onDelete: handleDeleteSelected,
    onEscape: handleEscape,
  });

  async function handleDelete() {
    if (grid.deleteIds.length === 0) return;

    try {
      setIsDeleting(true);
      await Promise.all(grid.deleteIds.map((id) => webhooksService.destroy(id)));
      showSuccess(
        grid.deleteIds.length === 1
          ? 'Webhook removido.'
          : `${grid.deleteIds.length} webhooks removidos.`,
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
      void load();
    } catch (error) {
      showError('Erro ao remover webhook(s).', error);
    } finally {
      setIsDeleting(false);
    }
  }

  const handleEditWebhook = useCallback(
    (webhookId: number) => navigate(`/webhooks/${webhookId}`),
    [navigate],
  );

  async function handleRowStatusChange(webhook: Webhook, active: boolean) {
    if (webhook.is_active === active) return;

    try {
      setRowStatusId(webhook.id);
      await webhooksService.toggleActive(webhook.id, active);
      showToggleActive(active, TOGGLE_ACTIVE_LABELS.webhook);
      void load();
    } catch (error) {
      showError('Erro ao atualizar status do webhook.', error);
    } finally {
      setRowStatusId(null);
    }
  }

  function handleExport() {
    showInfo('Exportação em breve.');
  }

  const columnDefinitions = useMemo<GridColumnDef<Webhook>[]>(
    () => [
      {
        id: 'select',
        label: '#',
        pinned: 'start',
        hideable: false,
        className: 'w-[40px]',
        render: (webhook) => (
          <Checkbox
            checked={grid.selected.includes(webhook.id)}
            onCheckedChange={() => grid.toggleSelect(webhook.id)}
            onClick={(event) => event.stopPropagation()}
          />
        ),
      },
      {
        id: 'id',
        label: 'Id',
        sortable: true,
        sortKey: 'id',
        filter: { type: 'multi', filterKey: 'id', placeholder: 'ID', inputMode: 'numeric' },
        className: 'w-[70px] text-sm text-muted-foreground',
        render: (webhook) => webhook.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'w-[72px]',
        render: (webhook) => (
          <GridRowActions
            actions={[
              {
                label: 'Logs',
                icon: ScrollText,
                onClick: () => setViewDeliveries(webhook),
              },
              {
                label: 'Editar',
                icon: Pencil,
                onClick: () => handleEditWebhook(webhook.id),
              },
              {
                label: 'Remover',
                icon: Trash2,
                tone: 'destructive',
                onClick: () => grid.requestDelete([webhook.id]),
              },
            ]}
          />
        ),
      },
      {
        id: 'is_active',
        label: 'Ativo',
        sortable: true,
        sortKey: 'is_active',
        filter: {
          type: 'select',
          filterKey: 'status',
          placeholder: 'Todos',
          options: STATUS_FILTER_OPTIONS,
        },
        className: 'w-[80px]',
        render: (webhook) => (
          <Switch
            size="sm"
            checked={webhook.is_active}
            disabled={rowStatusId === webhook.id}
            onCheckedChange={(checked) => void handleRowStatusChange(webhook, checked)}
          />
        ),
      },
      {
        id: 'url',
        label: 'URL',
        sortable: true,
        sortKey: 'url',
        filter: { type: 'text', filterKey: 'url', placeholder: 'URL' },
        className: 'min-w-[220px]',
        render: (webhook) => (
          <p className="max-w-[320px] truncate font-mono text-sm">{webhook.url}</p>
        ),
      },
      {
        id: 'events',
        label: 'Eventos',
        className: 'min-w-[180px]',
        render: (webhook) => (
          <div className="flex flex-wrap gap-1">
            {webhook.events.slice(0, 2).map((event) => (
              <GridBadge key={event} variant="outline" className="text-xs">
                {getEventLabel(event)}
              </GridBadge>
            ))}
            {webhook.events.length > 2 && (
              <GridBadge variant="outline" className="text-xs">
                +{webhook.events.length - 2}
              </GridBadge>
            )}
          </div>
        ),
      },
      {
        id: 'created_at',
        label: 'Criado em',
        sortable: true,
        sortKey: 'created_at',
        filter: { type: 'dateRange', filterKey: 'created_at' },
        className: 'min-w-[150px] text-sm text-muted-foreground whitespace-nowrap',
        render: (webhook) => formatCreatedAt(webhook.created_at),
      },
    ],
    [
      grid.requestDelete,
      grid.selected,
      grid.toggleSelect,
      handleEditWebhook,
      rowStatusId,
    ],
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
    columnFilters.filters,
    columnFilters.clearFilter,
    columnFilters.clearDateRangeFilter,
    grid.search,
    grid.clearSearch,
  ]);

  function handleResetColumns() {
    gridColumns.resetColumns();
    showSuccess('Colunas restauradas ao padrão.');
  }

  function handleClearFilters() {
    grid.clearSearch();
    columnFilters.clearAllFilters();
    showSuccess('Filtros removidos.');
  }

  function handleResetGrid() {
    gridColumns.resetColumns();
    grid.clearSearch();
    columnFilters.clearAllFilters();
    grid.resetSettings();
    showSuccess('Grid restaurado ao padrão.');
  }

  const hasActiveFilters = grid.hasFilters || columnFilters.hasFilters;
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onNew={() => navigate('/webhooks/new')}
        onEdit={handleEditSelected}
        onActivate={() => void grid.activateSelected()}
        onDeactivate={() => void grid.deactivateSelected()}
        onDelete={handleDeleteSelected}
        hasSelection={grid.hasSelection && !grid.isTogglingActive}
        singleSelection={grid.singleSelection && !grid.isTogglingActive}
        isTogglingActive={grid.isTogglingActive}
      />
    ),
    [
      navigate,
      grid.activateSelected,
      grid.deactivateSelected,
      grid.hasSelection,
      grid.isTogglingActive,
      grid.singleSelection,
      handleDeleteSelected,
      handleEditSelected,
    ],
  );

  usePageToolbar({
    title: 'Webhooks',
    description: 'Integre eventos do sistema com sistemas externos.',
    actions: toolbarActions,
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={
          <GridPanelToolbar
            onSelectAll={() => grid.toggleSelectAll(webhooks.map((w) => w.id))}
            isAllSelected={grid.isAllSelected(webhooks.length)}
            selectedCount={grid.selected.length}
            onClearSelection={grid.clearSelection}
            onRefresh={load}
            isRefreshing={loading}
            onExport={handleExport}
            search={grid.search}
            onSearch={grid.setSearch}
            filters={{
              active: activeFilters,
              onClearAll: hasActiveFilters ? handleClearFilters : undefined,
              columnFilters: {
                columns: gridColumns.visibleColumns,
                values: columnFilters.filters,
                onFilterChange: columnFilters.setFilter,
                onDateRangeChange: columnFilters.setDateRangeFilter,
                onFilterClear: columnFilters.clearColumnFilter,
              },
            }}
            columnsControl={
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
                onResetDefault={handleResetColumns}
              />
            }
            resetControl={
              <GridResetControl
                disabled={!isGridCustomized}
                onReset={handleResetGrid}
              />
            }
            recordCount={{ total: meta.total }}
          />
        }
        footer={
          <GridPagination
            meta={meta}
            perPage={grid.perPage}
            onPageChange={grid.setPage}
            onPerPageChange={grid.setPerPage}
          />
        }
      >
        <GridTable
          columns={gridColumns.visibleColumns}
          data={webhooks}
          getRowKey={(webhook) => webhook.id}
          loading={loading}
          emptyMessage="Nenhum webhook configurado."
          sort={grid.sort}
          sortDir={grid.sortDir}
          onSort={grid.toggleSort}
          onColumnOrderChange={gridColumns.reorderDraggableColumns}
          columnFilters={columnFilters.filters}
          onColumnFilterChange={columnFilters.setFilter}
          onDateRangeFilterChange={columnFilters.setDateRangeFilter}
          onColumnFilterClear={columnFilters.clearColumnFilter}
          isRowSelected={(webhook) => grid.selected.includes(webhook.id)}
          onRowClick={(webhook, event) =>
            grid.selectRow(webhook.id, {
              shift: event.shiftKey,
              rangeOrder: webhooks.map((item) => item.id),
            })
          }
          onRowDoubleClick={(webhook) => handleEditWebhook(webhook.id)}
        />
      </GridPanel>

      <Dialog open={!!viewDeliveries} onOpenChange={(open) => !open && setViewDeliveries(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Logs de entrega — {viewDeliveries?.url}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            {deliveriesLoading ? (
              <div className="py-8 text-center">
                <LoaderCircle className="mx-auto size-5 animate-spin text-muted-foreground" />
              </div>
            ) : deliveries.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma entrega registrada.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-mono text-xs">{delivery.event}</TableCell>
                      <TableCell>
                        {delivery.status === 'success'
                          ? <CheckCircle className="size-4 text-green-600" />
                          : <XCircle className="size-4 text-destructive" />}
                      </TableCell>
                      <TableCell>
                        <GridBadge
                          variant={
                            delivery.response_status && delivery.response_status < 300
                              ? 'primary'
                              : 'destructive'
                          }
                        >
                          {delivery.response_status ?? '—'}
                        </GridBadge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(delivery.created_at), "dd/MM 'às' HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={grid.deleteIds.length > 0}
        onOpenChange={(open) => !open && grid.clearDeleteRequest()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {grid.deleteIds.length === 1
                ? 'Remover webhook'
                : `Remover ${grid.deleteIds.length} webhooks`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
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
