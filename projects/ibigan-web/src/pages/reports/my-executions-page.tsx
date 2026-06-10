import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Download,
  LoaderCircle,
  XCircle,
} from 'lucide-react';
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
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
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridFiltersControl } from '@/components/grid/grid-filters-control';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import {
  downloadReportResultCsv,
  reportsService,
  type MyReportExecution,
} from '@/services/reports.service';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination } from '@/components/grid/grid-pagination';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridTable } from '@/components/grid/grid-table';
import { GridPanelToolbar } from '@/components/grid/grid-toolbar';
import { GridBadge } from '@/components/grid/grid-badge';
import { Button } from '@/components/ui/button';

const GRID_COLUMNS_KEY = 'grid-columns:report-executions';

const STATUS_OPTIONS = [
  { label: 'Na fila', value: 'queued' },
  { label: 'Executando', value: 'running' },
  { label: 'Concluído', value: 'completed' },
  { label: 'Falhou', value: 'failed' },
];

const STATUS_CONFIG: Record<string, {
  label: string;
  variant: 'primary' | 'secondary' | 'destructive' | 'outline';
}> = {
  queued: { label: 'Na fila', variant: 'secondary' },
  running: { label: 'Executando', variant: 'outline' },
  completed: { label: 'Concluído', variant: 'primary' },
  failed: { label: 'Falhou', variant: 'destructive' },
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'running') return <LoaderCircle className="size-4 animate-spin text-blue-500" />;
  if (status === 'completed') return <CheckCircle className="size-4 text-green-600" />;
  if (status === 'failed') return <XCircle className="size-4 text-destructive" />;
  return <Clock className="size-4 text-muted-foreground" />;
}

function matchesExecutionFilters(
  execution: MyReportExecution,
  search: string,
  filters: Record<string, string>,
): boolean {
  const q = search.trim().toLowerCase();
  if (q) {
    const matchesSearch =
      execution.template_name.toLowerCase().includes(q)
      || execution.status.toLowerCase().includes(q);
    if (!matchesSearch) return false;
  }

  const idFilter = filters.id?.trim();
  if (idFilter) {
    const ids = parseMultiFilterValue(idFilter);
    if (ids.length > 0 && !ids.includes(String(execution.id))) return false;
  }

  const templateName = filters.template_name?.trim();
  if (templateName && !execution.template_name.toLowerCase().includes(templateName.toLowerCase())) {
    return false;
  }

  const status = filters.status?.trim();
  if (status && execution.status !== status) return false;

  const from = filters[dateRangeFilterFromKey('executed_at')]?.trim();
  const to = filters[dateRangeFilterToKey('executed_at')]?.trim();
  const executedAt = parseISO(execution.executed_at);

  if (from && isBefore(executedAt, startOfDay(parseISO(from)))) return false;
  if (to && isAfter(executedAt, endOfDay(parseISO(to)))) return false;

  return true;
}

export function MyExecutionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useApiToolbarAlert();
  const grid = useGrid({ defaultSort: 'executed_at', defaultSortDir: 'desc' });
  const columnFilters = useGridFilters(() => grid.setPage(1));
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['my-executions', grid.page, grid.perPage],
    queryFn: () => reportsService.myExecutions(grid.page, grid.perPage),
    refetchInterval: (query) => {
      const items = query.state.data?.data.result.data ?? [];
      return items.some((item) => ['queued', 'running'].includes(item.status)) ? 3000 : false;
    },
  });

  const executions = data?.data.result.data ?? [];
  const meta = data?.data.result.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: grid.perPage,
    total: 0,
  };

  useEffect(() => {
    const prev = queryClient.getQueryData<typeof data>(['my-executions', grid.page, grid.perPage]);
    if (!prev || !data) return;

    const prevItems = prev.data.result.data ?? [];
    const currentItems = data.data.result.data ?? [];
    const justCompleted = currentItems.some((item) => {
      const was = prevItems.find((p) => p.id === item.id);
      return was?.status !== 'completed' && item.status === 'completed';
    });

    if (justCompleted) {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  }, [data, grid.page, grid.perPage, queryClient]);

  const handleDownload = useCallback(async (execution: MyReportExecution) => {
    try {
      setDownloadingId(execution.id);
      await downloadReportResultCsv(
        execution.template_id,
        execution.id,
        `${execution.template_name}-${execution.id}`,
      );
    } catch {
      showError('Erro ao baixar resultado.');
    } finally {
      setDownloadingId(null);
    }
  }, [showError]);

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['my-executions'] });
  }, [queryClient]);

  const columnDefinitions = useMemo<GridColumnDef<MyReportExecution>[]>(
    () => [
      {
        id: 'id',
        label: 'Id',
        className: 'w-[70px] text-sm text-muted-foreground',
        filter: { type: 'multi', filterKey: 'id', placeholder: 'ID', inputMode: 'numeric' },
        render: (execution) => execution.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'w-[72px]',
        render: (execution) => (
          <GridRowActions
            actions={[
              ...(execution.status === 'completed'
                ? [{
                    label: 'Baixar CSV',
                    icon: Download,
                    onClick: () => void handleDownload(execution),
                    disabled: downloadingId === execution.id,
                  }]
                : []),
              {
                label: 'Abrir relatório',
                icon: ArrowRight,
                onClick: () => navigate(`/reports/${execution.template_id}/executar`),
              },
            ]}
          />
        ),
      },
      {
        id: 'template_name',
        label: 'Relatório',
        className: 'min-w-[180px]',
        filter: { type: 'text', filterKey: 'template_name', placeholder: 'Relatório' },
        render: (execution) => (
          <div className="flex items-center gap-2">
            <StatusIcon status={execution.status} />
            <span className="font-medium">{execution.template_name}</span>
          </div>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        className: 'w-[120px]',
        filter: {
          type: 'select',
          filterKey: 'status',
          placeholder: 'Status',
          options: STATUS_OPTIONS,
        },
        render: (execution) => {
          const cfg = STATUS_CONFIG[execution.status] ?? STATUS_CONFIG.queued;
          return <GridBadge variant={cfg.variant}>{cfg.label}</GridBadge>;
        },
      },
      {
        id: 'progress',
        label: 'Progresso',
        className: 'min-w-[180px]',
        render: (execution) => {
          if (execution.status === 'completed') {
            return (
              <span className="text-sm text-muted-foreground">
                {execution.rows_count} registros · {execution.duration_ms}ms
              </span>
            );
          }
          if (execution.status === 'failed') {
            return (
              <span className="text-sm text-destructive">{execution.error_message ?? 'Erro'}</span>
            );
          }
          return (
            <span className="text-sm text-muted-foreground">
              {execution.progress_message ?? 'Aguardando...'}
            </span>
          );
        },
      },
      {
        id: 'executed_at',
        label: 'Executado em',
        className: 'w-[160px] whitespace-nowrap text-sm text-muted-foreground',
        filter: { type: 'dateRange', filterKey: 'executed_at' },
        render: (execution) => format(new Date(execution.executed_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR }),
      },
    ],
    [downloadingId, handleDownload, navigate],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const filteredExecutions = useMemo(
    () => executions.filter((execution) =>
      matchesExecutionFilters(execution, grid.debouncedSearch, columnFilters.debouncedFilters),
    ),
    [columnFilters.debouncedFilters, executions, grid.debouncedSearch],
  );

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

  const toolbarActions = useMemo(
    () => (
      <Button variant="outline" size="sm" className="h-8" onClick={() => navigate('/reports')}>
        Ver relatórios
      </Button>
    ),
    [navigate],
  );

  usePageToolbar({
    title: 'Minhas Execuções',
    description: 'Acompanhe o status dos seus relatórios e baixe os resultados.',
    actions: toolbarActions,
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={(
          <GridPanelToolbar
            onRefresh={refresh}
            isRefreshing={isLoading || isFetching}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder="Buscar por relatório ou status..."
            filtersControl={(
              <GridFiltersControl
                filters={activeFilters}
                onClearAll={hasActiveFilters ? handleClearFilters : undefined}
              />
            )}
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
          data={filteredExecutions}
          getRowKey={(execution) => execution.id}
          loading={isLoading || isFetching}
          emptyMessage="Nenhuma execução encontrada."
          onColumnOrderChange={gridColumns.reorderDraggableColumns}
          columnFilters={columnFilters.filters}
          onColumnFilterChange={columnFilters.setFilter}
          onDateRangeFilterChange={columnFilters.setDateRangeFilter}
          onColumnFilterClear={columnFilters.clearColumnFilter}
          onRowDoubleClick={(execution) => navigate(`/reports/${execution.template_id}/executar`)}
        />
      </GridPanel>
    </PageBody>
  );
}
