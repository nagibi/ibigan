import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Play, Trash2 } from 'lucide-react';
import { GRID_VIEW_ICON } from '@/lib/grid-view-action';
import { getColumnFilterDisplayValue } from '@/lib/grid-filter-display';
import { useNavigate } from 'react-router-dom';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useGridPageActions } from '@/hooks/use-grid-page-actions';
import { TOGGLE_ACTIVE_LABELS } from '@/lib/toggle-active-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridExport } from '@/hooks/use-grid-export';
import { useGridFilters } from '@/hooks/use-grid-filters';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import { useGridViewMode } from '@/hooks/use-grid-view-mode';
import { useGridInfiniteScroll } from '@/hooks/use-grid-infinite-scroll';
import { usePlatformCatalogMode } from '@/hooks/use-platform-catalog-mode';
import { type ReportTemplate } from '@/services/reports.service';
import { VIEW_PREFERENCE_KEYS, type ViewPreferenceKey } from '@/types/view-mode';
import { buildServerGridInfiniteScrollProps } from '@/lib/grid-infinite-scroll';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridColumnDataView } from '@/components/grid/grid-column-data-view';
import { getGridRecordCount } from '@/components/grid/grid-record-count';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridViewModeControl } from '@/components/grid/grid-view-mode-control';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination, type GridPaginationMeta } from '@/components/grid/grid-pagination';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { PlatformCatalogBadge } from '@/components/platform/platform-catalog-badge';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { AlertDialogPanelTitle } from '@/components/common/panel-title';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

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
  const catalog = usePlatformCatalogMode();
  const { isPlatformCatalog, reports: catalogPaths } = catalog;
  const reportsService = catalogPaths.service;
  const listPath = catalogPaths.listPath;
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const { showSuccess, showToggleActive, showError } = useApiToolbarAlert();
  const viewPreferenceKey = (isPlatformCatalog
    ? VIEW_PREFERENCE_KEYS.platformReports
    : VIEW_PREFERENCE_KEYS.reports) as ViewPreferenceKey;
  const { viewMode, setViewMode, infiniteScrollEnabled } = useGridViewMode(viewPreferenceKey);

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

  const infiniteScroll = useGridInfiniteScroll<ReportTemplate>({
    enabled: infiniteScrollEnabled,
    page: grid.page,
    setPage: grid.setPage,
    loading,
    perPage: grid.perPage,
    meta,
    resetDeps: [
      grid.debouncedSearch,
      grid.sort,
      grid.sortDir,
      columnFilters.activeFilterParams,
      infiniteScrollEnabled,
    ],
  });

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
      const pageReports = res.data.result.data;
      setReports(pageReports);
      infiniteScroll.receivePage(pageReports, grid.page);
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
    infiniteScroll.receivePage,
    showError,
  ]);

  const displayReports = infiniteScrollEnabled ? infiniteScroll.items : reports;

  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  const handleEditSelected = useCallback(() => {
    if (!grid.singleSelection) return;
    navigate(catalogPaths.getEditPath(grid.selected[0]));
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
    canDelete: !isPlatformCatalog && grid.hasSelection,
    onEdit: handleEditSelected,
    onDelete: handleDeleteSelected,
    onEscape: handleEscape,
  });

  async function handleDelete() {
    if (isPlatformCatalog || grid.deleteIds.length === 0) return;

    const deletableIds = grid.deleteIds.filter((id) => {
      const report = reports.find((item) => item.id === id);
      return report && !report.is_system;
    });

    if (deletableIds.length === 0) {
      showError('Relatórios de plataforma não podem ser removidos.');
      grid.clearDeleteRequest();
      return;
    }

    try {
      setIsDeleting(true);
      await Promise.all(deletableIds.map((id) => ('destroy' in reportsService
        ? reportsService.destroy(id)
        : Promise.resolve())));
      showSuccess(
        deletableIds.length === 1
          ? 'Relatório removido.'
          : `${deletableIds.length} relatórios removidos.`,
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
    (reportId: number) => navigate(catalogPaths.getEditPath(reportId)),
    [catalogPaths, navigate],
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
        className: 'min-w-[100px] w-[100px]',
        render: (report) => (
          <GridRowActions
            actions={[
              {
                label: 'Executar',
                icon: Play,
                hidden: isPlatformCatalog || !report.is_active,
                onClick: () => navigate(`/reports/${report.id}/execute`),
              },
              {
                label: 'Visualizar',
                icon: GRID_VIEW_ICON,
                onClick: () => handleEditReport(report.id),
              },
              {
                label: 'Remover',
                icon: Trash2,
                tone: 'destructive',
                hidden: isPlatformCatalog || report.is_system,
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
        render: (report) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate">{report.name}</span>
            {report.is_system || isPlatformCatalog ? <PlatformCatalogBadge /> : null}
          </div>
        ),
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
      isPlatformCatalog,
      rowStatusId,
    ],
  );

  const gridColumns = useGridColumns(catalogPaths.gridColumnsKey, columnDefinitions);

  const { handleExport, isExporting } = useGridExport({
    filename: 'relatorios',
    columns: gridColumns.visibleColumns,
    rows: displayReports,
  });

  const gridActions = useGridPageActions({
    resetColumns: gridColumns.resetColumns,
    clearAllFilters: columnFilters.clearAllFilters,
    clearSearch: grid.clearSearch,
    resetSettings: grid.resetSettings,
  });

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

      const displayValue = getColumnFilterDisplayValue(column.filter, value);

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

  const hasActiveFilters = grid.hasFilters || columnFilters.hasFilters;
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onNew={isPlatformCatalog ? undefined : () => navigate(`${listPath}/new`)}
        onEdit={handleEditSelected}
        onActivate={() => void grid.activateSelected()}
        onDeactivate={() => void grid.deactivateSelected()}
        onDelete={isPlatformCatalog ? undefined : handleDeleteSelected}
        onExport={handleExport}
        isExporting={isExporting}
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
      handleExport,
      isExporting,
    ],
  );

  usePageToolbar({
    title: isPlatformCatalog ? 'Relatórios padrão' : 'Relatórios',
    description: isPlatformCatalog
      ? 'Edite os relatórios padrão propagados para todos os tenants.'
      : 'Execute e gerencie relatórios dinâmicos.',
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
            isExporting={isExporting}
            search={grid.search}
            onSearch={grid.setSearch}
            filters={{
              active: activeFilters,
              onClearAll: hasActiveFilters ? gridActions.handleClearFilters : undefined,
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
                onResetDefault={gridActions.handleResetColumns}
              />
            }
            resetControl={
              <GridResetControl
                disabled={!isGridCustomized}
                onReset={gridActions.handleResetGrid}
              />
            }
            viewModeControl={
              <GridViewModeControl viewMode={viewMode} onViewModeChange={setViewMode} />
            }
            recordCount={getGridRecordCount(meta.total, displayReports.length, infiniteScrollEnabled)}
          />
        }
        footer={!infiniteScrollEnabled ? pagination : undefined}
      >
        <GridColumnDataView
          viewMode={viewMode}
          columns={gridColumns.visibleColumns}
          data={reports}
          cardData={infiniteScrollEnabled ? displayReports : undefined}
          getRowKey={(report) => report.id}
          loading={loading}
          emptyMessage="Nenhum relatório encontrado."
          infiniteScroll={buildServerGridInfiniteScrollProps({
            enabled: infiniteScrollEnabled,
            infiniteScroll,
            loading,
          })}
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

      {!isPlatformCatalog ? (
      <AlertDialog
        open={grid.deleteIds.length > 0}
        onOpenChange={(open) => !open && grid.clearDeleteRequest()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogPanelTitle icon={Trash2}>
              {grid.deleteIds.length === 1 ? 'Remover relatório' : `Remover ${grid.deleteIds.length} relatórios`}
            </AlertDialogPanelTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel />
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
      ) : null}
    </PageBody>
  );
}
