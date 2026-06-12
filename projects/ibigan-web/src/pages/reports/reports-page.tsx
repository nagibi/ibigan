import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Play, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { TOGGLE_ACTIVE_LABELS } from '@/lib/toggle-active-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridFilters } from '@/hooks/use-grid-filters';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import { reportsService, type ReportTemplate } from '@/services/reports.service';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination, type GridPaginationMeta } from '@/components/grid/grid-pagination';
import { GridTable } from '@/components/grid/grid-table';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const GRID_COLUMNS_KEY = 'grid-columns:reports';

const STATUS_FILTER_OPTIONS = [
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
];

function formatAuditDate(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), 'dd/MM/yy HH:mm', { locale: ptBR });
}

export function ReportsPage() {
  const navigate = useNavigate();
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const { showSuccess, showToggleActive, showError } = useApiToolbarAlert();

  const grid = useGrid({
    onActivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => reportsService.toggleActive(id, true)));
        showToggleActive(true, TOGGLE_ACTIVE_LABELS.report, ids.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao ativar relatório(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
    onDeactivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => reportsService.toggleActive(id, false)));
        showToggleActive(false, TOGGLE_ACTIVE_LABELS.report, ids.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao inativar relatório(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
  });

  const columnFilters = useGridFilters(() => grid.setPage(1));

  const [reports, setReports] = useState<ReportTemplate[]>([]);
  const [meta, setMeta] = useState<GridPaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowStatusId, setRowStatusId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reportsService.list(
        grid.page,
        grid.resolvePerPage(meta.total),
        grid.debouncedSearch,
        grid.sort,
        grid.sortDir,
        columnFilters.activeFilterParams,
      );
      setReports(res.data.result.data);
      setMeta(res.data.result.meta);
    } catch (error) {
      showError('Erro ao carregar relatórios.', error);
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

  const handleEditSelected = useCallback(() => {
    if (!grid.singleSelection) return;
    navigate(`/reports/${grid.selected[0]}`);
  }, [grid.singleSelection, grid.selected, navigate]);

  const handleDeleteSelected = useCallback(() => {
    if (!grid.hasSelection) return;
    grid.requestDelete(grid.selected);
  }, [grid.hasSelection, grid.requestDelete, grid.selected]);

  const handleEscape = useCallback(() => {
    if (grid.deleteIds.length > 0) {
      grid.clearDeleteRequest();
    }
    if (grid.hasSelection) {
      grid.clearSelection();
    }
  }, [
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
      await Promise.all(grid.deleteIds.map((id) => reportsService.destroy(id)));
      showSuccess(
        grid.deleteIds.length === 1
          ? 'Relatório removido.'
          : `${grid.deleteIds.length} relatórios removidos.`,
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
      void load();
    } catch (error) {
      showError('Erro ao remover relatório(s).', error);
    } finally {
      setIsDeleting(false);
    }
  }

  const handleEditReport = useCallback(
    (reportId: number) => navigate(`/reports/${reportId}`),
    [navigate],
  );

  async function handleRowStatusChange(report: ReportTemplate, active: boolean) {
    if (report.is_active === active) return;

    try {
      setRowStatusId(report.id);
      await reportsService.toggleActive(report.id, active);
      showToggleActive(active, TOGGLE_ACTIVE_LABELS.report);
      void load();
    } catch (error) {
      showError('Erro ao atualizar status do relatório.', error);
    } finally {
      setRowStatusId(null);
    }
  }

  function handleExport() {
    toast.info('Exportação em breve.');
  }

  const columnDefinitions = useMemo<GridColumnDef<ReportTemplate>[]>(
    () => [
      {
        id: 'select',
        label: '#',
        pinned: 'start',
        hideable: false,
        className: 'w-[40px]',
        render: (report) => (
          <Checkbox
            checked={grid.selected.includes(report.id)}
            onCheckedChange={() => grid.toggleSelect(report.id)}
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
        render: (report) => report.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'w-[72px]',
        render: (report) => (
          <GridRowActions
            actions={[
              {
                label: 'Executar',
                icon: Play,
                hidden: !report.is_active,
                onClick: () => navigate(`/reports/${report.id}/executar`),
              },
              {
                label: 'Editar',
                icon: Pencil,
                onClick: () => handleEditReport(report.id),
              },
              {
                label: 'Remover',
                icon: Trash2,
                tone: 'destructive',
                onClick: () => grid.requestDelete([report.id]),
              },
            ]}
          />
        ),
      },
      {
        id: 'active',
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
        render: (report) => (
          <Switch
            size="sm"
            checked={report.is_active}
            disabled={rowStatusId === report.id}
            onCheckedChange={(checked) => void handleRowStatusChange(report, checked)}
          />
        ),
      },
      {
        id: 'name',
        label: 'Nome',
        sortable: true,
        sortKey: 'name',
        filter: { type: 'text', filterKey: 'name', placeholder: 'Nome' },
        className: 'min-w-[200px]',
        render: (report) => <span className="font-medium">{report.name}</span>,
      },
      {
        id: 'description',
        label: 'Descrição',
        filter: { type: 'text', filterKey: 'description', placeholder: 'Descrição' },
        className: 'min-w-[200px] max-w-[320px]',
        render: (report) => (
          <p className="truncate text-sm text-muted-foreground">
            {report.description ?? '—'}
          </p>
        ),
      },
      {
        id: 'parameters',
        label: 'Parâmetros',
        className: 'w-[100px] text-sm text-muted-foreground',
        render: (report) => (report.parameters ?? []).length,
      },
      {
        id: 'created_at',
        label: 'Data criação',
        sortable: true,
        sortKey: 'created_at',
        className: 'min-w-[150px] text-sm text-muted-foreground whitespace-nowrap',
        render: (report) => formatAuditDate(report.created_at),
      },
    ],
    [
      grid.requestDelete,
      grid.selected,
      grid.toggleSelect,
      handleEditReport,
      navigate,
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
    grid.search,
    grid.clearSearch,
  ]);

  function handleResetColumns() {
    gridColumns.resetColumns();
    toast.success('Colunas restauradas ao padrão.');
  }

  function handleClearFilters() {
    grid.clearSearch();
    columnFilters.clearAllFilters();
    toast.success('Filtros removidos.');
  }

  function handleResetGrid() {
    gridColumns.resetColumns();
    grid.clearSearch();
    columnFilters.clearAllFilters();
    grid.resetSettings();
    toast.success('Grid restaurado ao padrão.');
  }

  const hasActiveFilters = grid.hasFilters || columnFilters.hasFilters;
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onNew={() => navigate('/reports/new')}
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
    title: 'Relatórios',
    description: 'Execute e gerencie relatórios dinâmicos.',
    actions: toolbarActions,
  });

  const pagination = (
    <GridPagination
      meta={meta}
      perPage={grid.perPage}
      onPageChange={grid.setPage}
      onPerPageChange={grid.setPerPage}
    />
  );

  return (
    <PageBody>
      <GridPanel
        toolbar={
          <GridPanelToolbar
            onSelectAll={() => grid.toggleSelectAll(reports.map((r) => r.id))}
            isAllSelected={grid.isAllSelected(reports.length)}
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
        footer={pagination}
      >
        <GridTable
          columns={gridColumns.visibleColumns}
          data={reports}
          getRowKey={(report) => report.id}
          loading={loading}
          emptyMessage="Nenhum relatório encontrado."
          sort={grid.sort}
          sortDir={grid.sortDir}
          onSort={grid.toggleSort}
          onColumnOrderChange={gridColumns.reorderDraggableColumns}
          columnFilters={columnFilters.filters}
          onColumnFilterChange={columnFilters.setFilter}
          onColumnFilterClear={columnFilters.clearColumnFilter}
          isRowSelected={(report) => grid.selected.includes(report.id)}
          onRowClick={(report, event) =>
            grid.selectRow(report.id, {
              shift: event.shiftKey,
              rangeOrder: reports.map((item) => item.id),
            })
          }
          onRowDoubleClick={(report) => handleEditReport(report.id)}
        />
      </GridPanel>

      <AlertDialog
        open={grid.deleteIds.length > 0}
        onOpenChange={(open) => !open && grid.clearDeleteRequest()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {grid.deleteIds.length === 1 ? 'Remover relatório' : `Remover ${grid.deleteIds.length} relatórios`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
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
