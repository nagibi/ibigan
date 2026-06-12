import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import {
  dateRangeFilterFromKey,
  dateRangeFilterToKey,
  useGridFilters,
} from '@/hooks/use-grid-filters';
import { formatDateRangeFilterLabel } from '@/components/grid/grid-date-range-filter';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import { activityLogsService, type ActivityLog } from '@/services/activity-logs.service';
import {
  countActivityChanges,
  descriptionLabel,
  descriptionVariant,
  getSubjectLabel,
} from '@/lib/activity-log-utils';
import { ActivityLogDetailDialog } from '@/components/activity-logs/activity-log-detail-dialog';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination, type GridPaginationMeta } from '@/components/grid/grid-pagination';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridTable } from '@/components/grid/grid-table';
import { GridPanelToolbar } from '@/components/grid/grid-toolbar';
import { GridBadge } from '@/components/grid/grid-badge';

const GRID_COLUMNS_KEY = 'grid-columns:activity-logs';

const STATUS_FILTER_OPTIONS = [
  { label: 'Criado', value: 'created' },
  { label: 'Atualizado', value: 'updated' },
  { label: 'Removido', value: 'deleted' },
];

const SUBJECT_TYPE_OPTIONS = [
  { label: 'Usuário', value: 'App\\Models\\User' },
  { label: 'Menu', value: 'App\\Models\\Menu' },
  { label: 'Template', value: 'App\\Models\\MessageTemplate' },
  { label: 'Webhook', value: 'App\\Models\\Webhook' },
  { label: 'Campanha', value: 'App\\Models\\Campaign' },
  { label: 'Convite', value: 'App\\Models\\Invite' },
];

function hasChanges(props: Record<string, unknown>): boolean {
  return countActivityChanges(props) > 0;
}

function matchesColumnFilters(log: ActivityLog, filters: Record<string, string>): boolean {
  const idFilter = filters.id?.trim();
  if (idFilter) {
    const ids = parseMultiFilterValue(idFilter);
    if (ids.length > 0 && !ids.includes(String(log.id))) return false;
  }

  const statusFilter = filters.description?.trim();
  if (statusFilter && log.description !== statusFilter) return false;

  return true;
}

function downloadActivityLog(log: ActivityLog) {
  const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `activity-log-${log.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ActivityLogsPage() {
  const { showSuccess, showError } = useApiToolbarAlert();
  const grid = useGrid();
  const columnFilters = useGridFilters(() => grid.setPage(1));

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [meta, setMeta] = useState<GridPaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const filters = columnFilters.activeFilterParams;
      const res = await activityLogsService.list(grid.page, {
        per_page: grid.resolvePerPage(meta.total),
        subject_type: filters.subject_type || undefined,
        date_from: filters[dateRangeFilterFromKey('created_at')] || undefined,
        date_to: filters[dateRangeFilterToKey('created_at')] || undefined,
      });
      setLogs(res.data.result.data);
      setMeta(res.data.result.meta);
    } catch (error) {
      showError('Erro ao carregar activity log.', error);
    } finally {
      setLoading(false);
    }
  }, [columnFilters.activeFilterParams, grid.page, grid.perPage, grid.resolvePerPage, meta.total, showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const columnDefinitions = useMemo<GridColumnDef<ActivityLog>[]>(
    () => [
      {
        id: 'id',
        label: 'Id',
        className: 'w-[70px] text-sm text-muted-foreground',
        filter: { type: 'multi', filterKey: 'id', placeholder: 'ID', inputMode: 'numeric' },
        render: (log) => log.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'w-[72px]',
        render: (log) => (
          <GridRowActions
            actions={[
              {
                label: 'Download',
                icon: Download,
                onClick: () => downloadActivityLog(log),
              },
            ]}
          />
        ),
      },
      {
        id: 'subject',
        label: 'Recurso',
        className: 'min-w-[160px]',
        filter: {
          type: 'select',
          filterKey: 'subject_type',
          placeholder: 'Tipo',
          options: SUBJECT_TYPE_OPTIONS,
        },
        render: (log) => (
          <span className="text-sm font-medium">{getSubjectLabel(log.subject_type)}</span>
        ),
      },
      {
        id: 'description',
        label: 'Status',
        className: 'w-[120px]',
        filter: {
          type: 'select',
          filterKey: 'description',
          placeholder: 'Status',
          options: STATUS_FILTER_OPTIONS,
        },
        render: (log) => (
          <GridBadge variant={descriptionVariant[log.description] ?? 'outline'}>
            {descriptionLabel[log.description] ?? log.description}
          </GridBadge>
        ),
      },
      {
        id: 'causer',
        label: 'Realizado por',
        className: 'min-w-[140px]',
        render: (log) => (
          <span className="text-sm">
            {log.causer_name ?? <span className="text-muted-foreground">Sistema</span>}
          </span>
        ),
      },
      {
        id: 'details',
        label: 'Detalhes',
        className: 'min-w-[140px]',
        render: (log) => (
          <span className="text-xs text-muted-foreground">
            {hasChanges(log.properties)
              ? `${countActivityChanges(log.properties)} campo(s) alterado(s)`
              : '—'}
          </span>
        ),
      },
      {
        id: 'created_at',
        label: 'Data',
        filter: { type: 'dateRange', filterKey: 'created_at' },
        className: 'w-[160px] whitespace-nowrap text-sm text-muted-foreground',
        render: (log) => format(new Date(log.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR }),
      },
    ],
    [],
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

      const displayValue = column.filter.type === 'select'
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

  const hasActiveFilters = grid.hasFilters || columnFilters.hasFilters;

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

  const filteredLogs = useMemo(() => {
    const q = grid.debouncedSearch.trim().toLowerCase();

    return logs.filter((log) => {
      if (!matchesColumnFilters(log, columnFilters.debouncedFilters)) return false;

      if (!q) return true;

      return (
        String(log.id).includes(q)
        || getSubjectLabel(log.subject_type).toLowerCase().includes(q)
        || String(log.subject_id).includes(q)
        || (log.causer_name?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [columnFilters.debouncedFilters, grid.debouncedSearch, logs]);

  usePageToolbar({
    title: 'Activity Log',
    description: 'Histórico de atividades do sistema.',
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={(
          <GridPanelToolbar
            onRefresh={() => void load()}
            isRefreshing={loading}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder="Buscar por recurso ou usuário..."
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
                onResetDefault={() => {
                  gridColumns.resetColumns();
                  showSuccess('Colunas restauradas ao padrão.');
                }}
              />
            )}
            resetControl={(
              <GridResetControl
                disabled={!hasActiveFilters && !gridColumns.isCustomized && !grid.isCustomized}
                onReset={handleResetGrid}
              />
            )}
            recordCount={{ total: meta.total }}
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
          data={filteredLogs}
          getRowKey={(log) => log.id}
          loading={loading}
          emptyMessage="Nenhuma atividade registrada."
          onColumnOrderChange={gridColumns.reorderDraggableColumns}
          columnFilters={columnFilters.filters}
          onColumnFilterChange={columnFilters.setFilter}
          onDateRangeFilterChange={columnFilters.setDateRangeFilter}
          onColumnFilterClear={columnFilters.clearColumnFilter}
          onRowClick={(log) => setSelectedLog(log)}
        />
      </GridPanel>

      <ActivityLogDetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
    </PageBody>
  );
}
