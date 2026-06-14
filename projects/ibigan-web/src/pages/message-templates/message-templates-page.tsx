import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Copy, FlaskConical, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import { useGridViewMode } from '@/hooks/use-grid-view-mode';
import { useGridInfiniteScroll } from '@/hooks/use-grid-infinite-scroll';
import { usePlatformCatalogMode } from '@/hooks/use-platform-catalog-mode';
import { VIEW_PREFERENCE_KEYS, type ViewPreferenceKey } from '@/types/view-mode';
import { buildServerGridInfiniteScrollProps } from '@/lib/grid-infinite-scroll';
import {
  type MessageTemplate,
} from '@/services/message-templates.service';
import { GridColumnDataView } from '@/components/grid/grid-column-data-view';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { getGridRecordCount } from '@/components/grid/grid-record-count';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridViewModeControl } from '@/components/grid/grid-view-mode-control';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination, type GridPaginationMeta } from '@/components/grid/grid-pagination';
import { GridRowActions } from '@/components/grid/grid-row-actions';
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
import { GridBadge } from '@/components/grid/grid-badge';
import { PlatformCatalogBadge } from '@/components/platform/platform-catalog-badge';
import { TemplateTestSendDialog } from '@/components/message-templates/template-test-send-dialog';
import type { TemplateTestSendPayload } from '@/components/message-templates/template-test-send-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const STATUS_FILTER_OPTIONS = [
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
];

export function MessageTemplatesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const catalog = usePlatformCatalogMode();
  const { isPlatformCatalog, messageTemplates: catalogPaths } = catalog;
  const templatesService = catalogPaths.service;
  const listPath = catalogPaths.listPath;
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const { showSuccess, showToggleActive, showError } = useApiToolbarAlert();

  const viewPreferenceKey = (isPlatformCatalog
    ? VIEW_PREFERENCE_KEYS.platformMessageTemplates
    : VIEW_PREFERENCE_KEYS.messageTemplates) as ViewPreferenceKey;

  const { viewMode, setViewMode, infiniteScrollEnabled } = useGridViewMode(viewPreferenceKey);

  const grid = useGrid({
    onActivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => templatesService.toggleActive(id, true)));
        showToggleActive(true, TOGGLE_ACTIVE_LABELS.template, ids.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao ativar template(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
    onDeactivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => templatesService.toggleActive(id, false)));
        showToggleActive(false, TOGGLE_ACTIVE_LABELS.template, ids.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao inativar template(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
  });

  const columnFilters = useGridFilters(() => grid.setPage(1));

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [meta, setMeta] = useState<GridPaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowStatusId, setRowStatusId] = useState<number | null>(null);
  const [testTemplate, setTestTemplate] = useState<MessageTemplate | null>(null);
  const [isTestSending, setIsTestSending] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  const infiniteScroll = useGridInfiniteScroll<MessageTemplate>({
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
      const res = await templatesService.list(
        grid.page,
        grid.resolvePerPage(meta.total),
        grid.debouncedSearch,
        grid.sort,
        grid.sortDir,
        columnFilters.activeFilterParams,
      );
      const pageTemplates = res.data.result.data;
      setTemplates(pageTemplates);
      infiniteScroll.receivePage(pageTemplates, grid.page);
      setMeta(res.data.result.meta);
    } catch (error) {
      showError('Erro ao carregar templates.', error);
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

  const displayTemplates = infiniteScrollEnabled ? infiniteScroll.items : templates;

  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  async function handleTestSendSubmit(payload: TemplateTestSendPayload) {
    if (!testTemplate || !('testSend' in templatesService)) return;

    try {
      setIsTestSending(true);
      const response = await templatesService.testSend(testTemplate.id, payload);
      showSuccess(`Teste enfileirado para ${response.data.result.recipient}.`);
      setTestTemplate(null);
    } catch (error) {
      showError('Erro ao enviar teste do template.', error);
    } finally {
      setIsTestSending(false);
    }
  }

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
      const template = templates.find((item) => item.id === id);
      return template && !template.is_system;
    });

    if (deletableIds.length === 0) {
      showError('Templates de plataforma não podem ser removidos.');
      grid.clearDeleteRequest();
      return;
    }

    try {
      setIsDeleting(true);
      await Promise.all(deletableIds.map((id) => ('destroy' in templatesService
        ? templatesService.destroy(id)
        : Promise.resolve())));
      showSuccess(
        deletableIds.length === 1
          ? 'Template removido.'
          : `${deletableIds.length} templates removidos.`,
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
      void load();
    } catch (error) {
      showError('Erro ao remover template(s).', error);
    } finally {
      setIsDeleting(false);
    }
  }

  const handleEditTemplate = useCallback(
    (templateId: number) => navigate(catalogPaths.getEditPath(templateId)),
    [catalogPaths, navigate],
  );

  async function handleDuplicate(templateId: number) {
    if (!('duplicate' in templatesService)) return;
    try {
      setDuplicatingId(templateId);
      const res = await templatesService.duplicate(templateId);
      showSuccess('Template duplicado com sucesso!');
      navigate(catalogPaths.getEditPath(res.data.result.id));
    } catch (error) {
      showError('Erro ao duplicar template.', error);
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleRowStatusChange(template: MessageTemplate, active: boolean) {
    if (template.is_active === active) return;

    try {
      setRowStatusId(template.id);
      await templatesService.toggleActive(template.id, active);
      showToggleActive(active, TOGGLE_ACTIVE_LABELS.template);
      void load();
    } catch (error) {
      showError('Erro ao atualizar status do template.', error);
    } finally {
      setRowStatusId(null);
    }
  }

  const columnDefinitions = useMemo<GridColumnDef<MessageTemplate>[]>(
    () => [
      {
        id: 'select',
        label: '#',
        pinned: 'start',
        hideable: false,
        className: 'w-[40px]',
        render: (template) => (
          <Checkbox
            checked={grid.selected.includes(template.id)}
            onCheckedChange={() => grid.toggleSelect(template.id)}
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
        render: (template) => template.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'min-w-[100px] w-[100px]',
        render: (template) => (
          <GridRowActions
            actions={[
              {
                label: 'Testar',
                icon: FlaskConical,
                hidden: !template.is_active || !('testSend' in templatesService),
                disabled: isTestSending && testTemplate?.id === template.id,
                onClick: () => setTestTemplate(template),
              },
              {
                label: 'Duplicar',
                icon: Copy,
                hidden: !('duplicate' in templatesService),
                disabled: duplicatingId === template.id,
                onClick: () => void handleDuplicate(template.id),
              },
              {
                label: 'Visualizar',
                icon: GRID_VIEW_ICON,
                onClick: () => handleEditTemplate(template.id),
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
        render: (template) => (
          <Switch
            checked={template.is_active}
            disabled={rowStatusId === template.id}
            onCheckedChange={(checked) => void handleRowStatusChange(template, checked)}
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
        render: (template) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate">{template.name}</span>
            {template.is_system || isPlatformCatalog ? <PlatformCatalogBadge /> : null}
          </div>
        ),
      },
      {
        id: 'slug',
        label: 'Slug',
        sortable: true,
        sortKey: 'slug',
        filter: { type: 'text', filterKey: 'slug', placeholder: 'Slug' },
        className: 'min-w-[160px] font-mono text-sm text-muted-foreground',
        render: (template) => template.slug,
      },
      {
        id: 'merge_tags',
        label: 'Merge Tags',
        className: 'min-w-[180px]',
        render: (template) => (
          <div className="flex flex-wrap gap-1">
            {template.merge_tags?.slice(0, 3).map((tag) => (
              <GridBadge key={tag} variant="outline" className="text-xs font-mono">
                {tag}
              </GridBadge>
            ))}
            {(template.merge_tags?.length ?? 0) > 3 && (
              <GridBadge variant="outline" className="text-xs">
                +{(template.merge_tags?.length ?? 0) - 3}
              </GridBadge>
            )}
          </div>
        ),
      },
    ],
    [
      duplicatingId,
      isTestSending,
      testTemplate?.id,
      grid.selected,
      grid.toggleSelect,
      handleEditTemplate,
      isPlatformCatalog,
      rowStatusId,
      templatesService,
    ],
  );

  const gridColumns = useGridColumns(catalogPaths.gridColumnsKey, columnDefinitions);

  const { handleExport, isExporting } = useGridExport({
    filename: 'templates-mensagem',
    columns: gridColumns.visibleColumns,
    rows: displayTemplates,
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
      isPlatformCatalog,
      listPath,
    ],
  );

  usePageToolbar({
    title: isPlatformCatalog ? 'Templates de mensagem' : 'Templates de Mensagem',
    description: isPlatformCatalog
      ? 'Edite os templates padrão propagados para todos os tenants.'
      : 'Gerencie templates de mensagens.',
    actions: toolbarActions,
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={
          <GridPanelToolbar
            onSelectAll={() => grid.toggleSelectAll(templates.map((t) => t.id))}
            isAllSelected={grid.isAllSelected(templates.length)}
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
            recordCount={getGridRecordCount(meta.total, displayTemplates.length, infiniteScrollEnabled)}
          />
        }
        footer={!infiniteScrollEnabled ? (
          <GridPagination
            meta={meta}
            perPage={grid.perPage}
            onPageChange={grid.setPage}
            onPerPageChange={grid.setPerPage}
          />
        ) : undefined}
      >
        <GridColumnDataView
          viewMode={viewMode}
          columns={gridColumns.visibleColumns}
          data={templates}
          cardData={infiniteScrollEnabled ? displayTemplates : undefined}
          getRowKey={(template) => template.id}
          loading={loading}
          emptyMessage="Nenhum template cadastrado."
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
          isRowSelected={(template) => grid.selected.includes(template.id)}
          onRowClick={(template, event) =>
            grid.selectRow(template.id, {
              shift: event.shiftKey,
              rangeOrder: templates.map((item) => item.id),
            })
          }
          onRowDoubleClick={(template) => handleEditTemplate(template.id)}
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
              {grid.deleteIds.length === 1
                ? 'Remover template'
                : `Remover ${grid.deleteIds.length} templates`}
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

      <TemplateTestSendDialog
        template={testTemplate}
        open={testTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setTestTemplate(null);
        }}
        isPlatformCatalog={isPlatformCatalog}
        onSubmit={handleTestSendSubmit}
        isSubmitting={isTestSending}
      />
    </PageBody>
  );
}
