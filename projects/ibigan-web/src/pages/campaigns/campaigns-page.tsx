import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart3, Trash2, X } from 'lucide-react';
import { GRID_VIEW_ICON } from '@/lib/grid-view-action';
import { getColumnFilterDisplayValue } from '@/lib/grid-filter-display';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useCampaignStatusFilterOptions } from '@/lib/grid-filter-options';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useGridPageActions } from '@/hooks/use-grid-page-actions';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridExport } from '@/hooks/use-grid-export';
import { useGridFilters } from '@/hooks/use-grid-filters';
import { useGridViewMode } from '@/hooks/use-grid-view-mode';
import { useGridInfiniteScroll } from '@/hooks/use-grid-infinite-scroll';
import { VIEW_PREFERENCE_KEYS } from '@/types/view-mode';
import { buildServerGridInfiniteScrollProps } from '@/lib/grid-infinite-scroll';
import { campaignsService, type Campaign } from '@/services/campaigns.service';
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
import { campaignStatusBadgeTone, channelBadgeToneFor, isCampaignDeletable, isCampaignEditable } from '@/lib/campaign-badges';
import { Checkbox } from '@/components/ui/checkbox';

const GRID_COLUMNS_KEY = 'grid-columns:campaigns';

const CANCELLABLE_STATUSES: Campaign['status'][] = ['draft', 'scheduled'];

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), "dd/MM/yy 'às' HH:mm", { locale: ptBR });
}

export function CampaignsPage() {
  const { t } = useTranslation();
  const statusFilterOptions = useCampaignStatusFilterOptions();
  const statusLabel = useMemo(
    () => ({
      draft: t('campaigns.status.draft'),
      scheduled: t('campaigns.status.scheduled'),
      sending: t('campaigns.status.sending'),
      sent: t('campaigns.status.sent'),
      cancelled: t('campaigns.status.cancelled'),
    }),
    [t],
  );
  const navigate = useNavigate();
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const { showSuccess, showError } = useApiToolbarAlert();

  const { viewMode, setViewMode, infiniteScrollEnabled } = useGridViewMode(VIEW_PREFERENCE_KEYS.campaigns);

  const grid = useGrid();
  const columnFilters = useGridFilters(() => grid.setPage(1));

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [meta, setMeta] = useState<GridPaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelId, setCancelId] = useState<number | null>(null);

  const infiniteScroll = useGridInfiniteScroll<Campaign>({
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
      const res = await campaignsService.list(
        grid.page,
        grid.resolvePerPage(meta.total),
        grid.debouncedSearch,
        grid.sort,
        grid.sortDir,
        columnFilters.activeFilterParams,
      );
      const pageCampaigns = res.data.result.data;
      setCampaigns(pageCampaigns);
      infiniteScroll.receivePage(pageCampaigns, grid.page);
      setMeta(res.data.result.meta);
    } catch (error) {
      showError('Erro ao carregar campanhas.', error);
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

  const displayCampaigns = infiniteScrollEnabled ? infiniteScroll.items : campaigns;

  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  const deletableSelectedIds = useMemo(
    () =>
      grid.selected.filter((id) => {
        const campaign = campaigns.find((item) => item.id === id);
        return campaign ? isCampaignDeletable(campaign) : false;
      }),
    [grid.selected, campaigns],
  );

  const hasDeletableSelection = deletableSelectedIds.length > 0;

  const selectedDraftId = useMemo(() => {
    if (!grid.singleSelection) return null;
    const campaign = campaigns.find((item) => item.id === grid.selected[0]);
    return campaign && isCampaignEditable(campaign) ? campaign.id : null;
  }, [grid.singleSelection, grid.selected, campaigns]);

  const handleEditSelected = useCallback(() => {
    if (selectedDraftId === null) return;
    navigate(`/campaigns/${selectedDraftId}`);
  }, [navigate, selectedDraftId]);

  const handleDeleteSelected = useCallback(() => {
    if (!hasDeletableSelection) return;
    grid.requestDelete(deletableSelectedIds);
  }, [grid.requestDelete, deletableSelectedIds, hasDeletableSelection]);

  const handleViewCampaign = useCallback(
    (campaignId: number) => navigate(`/campaigns/${campaignId}`),
    [navigate],
  );

  const handleEditCampaign = useCallback(
    (campaignId: number) => navigate(`/campaigns/${campaignId}`),
    [navigate],
  );

  const handleEscape = useCallback(() => {
    if (cancelId !== null) {
      setCancelId(null);
      return;
    }
    if (grid.deleteIds.length > 0) {
      grid.clearDeleteRequest();
    }
    if (grid.hasSelection) {
      grid.clearSelection();
    }
  }, [
    cancelId,
    grid.clearDeleteRequest,
    grid.clearSelection,
    grid.deleteIds.length,
    grid.hasSelection,
  ]);

  useGridKeyboard({
    canEdit: selectedDraftId !== null,
    canDelete: hasDeletableSelection,
    onEdit: handleEditSelected,
    onDelete: handleDeleteSelected,
    onEscape: handleEscape,
  });

  async function handleDelete() {
    if (grid.deleteIds.length === 0) return;

    try {
      setIsDeleting(true);
      await Promise.all(grid.deleteIds.map((id) => campaignsService.destroy(id)));
      showSuccess(
        grid.deleteIds.length === 1
          ? 'Campanha removida.'
          : `${grid.deleteIds.length} campanhas removidas.`,
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
      void load();
    } catch (error) {
      showError('Erro ao remover campanha(s).', error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleCancel() {
    if (cancelId === null) return;

    try {
      setIsCancelling(true);
      await campaignsService.cancel(cancelId);
      showSuccess('Campanha cancelada.');
      setCancelId(null);
      void load();
    } catch (error) {
      showError('Erro ao cancelar campanha.', error);
    } finally {
      setIsCancelling(false);
    }
  }

  const columnDefinitions = useMemo<GridColumnDef<Campaign>[]>(
    () => [
      {
        id: 'select',
        label: '#',
        pinned: 'start',
        hideable: false,
        className: 'w-[40px]',
        render: (campaign) => (
          <Checkbox
            checked={grid.selected.includes(campaign.id)}
            onCheckedChange={() => grid.toggleSelect(campaign.id)}
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
        render: (campaign) => campaign.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'min-w-[100px] w-[100px]',
        render: (campaign) => (
          <GridRowActions
            actions={[
              {
                label: 'Ver detalhes',
                icon: BarChart3,
                onClick: () => handleViewCampaign(campaign.id),
              },
              {
                label: 'Visualizar',
                icon: GRID_VIEW_ICON,
                hidden: !isCampaignEditable(campaign),
                onClick: () => handleEditCampaign(campaign.id),
              },
              {
                label: 'Cancelar',
                icon: X,
                hidden: !CANCELLABLE_STATUSES.includes(campaign.status),
                onClick: () => setCancelId(campaign.id),
              },
              {
                label: 'Excluir',
                icon: Trash2,
                tone: 'destructive',
                hidden: !isCampaignDeletable(campaign),
                onClick: () => grid.requestDelete([campaign.id]),
              },
            ]}
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
        render: (campaign) => (
          <div>
            <span>{campaign.name}</span>
            {campaign.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                {campaign.description}
              </p>
            )}
          </div>
        ),
      },
      {
        id: 'channels',
        label: 'Canais',
        className: 'min-w-[140px]',
        render: (campaign) => (
          <div className="flex flex-wrap gap-1">
            {campaign.channels.map((channel) => (
              <GridBadge key={channel} tone={channelBadgeToneFor(channel)} className="text-xs">
                {channel}
              </GridBadge>
            ))}
          </div>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        sortable: true,
        sortKey: 'status',
        filter: {
          type: 'select',
          filterKey: 'status',
          placeholder: 'Todos',
          options: statusFilterOptions,
        },
        className: 'w-[120px]',
        render: (campaign) => (
          <GridBadge tone={campaignStatusBadgeTone[campaign.status]}>
            {statusLabel[campaign.status]}
          </GridBadge>
        ),
      },
      {
        id: 'stats',
        label: 'Entregas',
        className: 'min-w-[120px]',
        render: (campaign) =>
          campaign.stats ? (
            <div className="text-sm">
              <span className="text-green-600">{campaign.stats.sent}</span>
              <span className="text-muted-foreground">/{campaign.stats.total}</span>
              {campaign.stats.failed > 0 && (
                <span className="text-destructive ml-1">({campaign.stats.failed} falhas)</span>
              )}
            </div>
          ) : (
            '—'
          ),
      },
      {
        id: 'created_at',
        label: 'Criado em',
        sortable: true,
        sortKey: 'created_at',
        className: 'min-w-[140px] text-sm text-muted-foreground',
        render: (campaign) => formatDateTime(campaign.created_at),
      },
    ],
    [
      grid.requestDelete,
      grid.selected,
      grid.toggleSelect,
      handleEditCampaign,
      handleViewCampaign,
      statusFilterOptions,
      statusLabel,
    ],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const { handleExport, isExporting } = useGridExport({
    filename: 'campanhas',
    columns: gridColumns.visibleColumns,
    rows: displayCampaigns,
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
        onNew={() => navigate('/campaigns/new')}
        onEdit={handleEditSelected}
        onDelete={handleDeleteSelected}
        onExport={handleExport}
        isExporting={isExporting}
        hasSelection={hasDeletableSelection}
        singleSelection={selectedDraftId !== null}
      />
    ),
    [
      navigate,
      handleEditSelected,
      handleDeleteSelected,
      handleExport,
      isExporting,
      hasDeletableSelection,
      selectedDraftId,
    ],
  );

  usePageToolbar({
    title: 'Campanhas',
    description: 'Gerencie comunicações e envios em massa.',
    actions: toolbarActions,
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={
          <GridPanelToolbar
            onSelectAll={() => grid.toggleSelectAll(campaigns.map((campaign) => campaign.id))}
            isAllSelected={grid.isAllSelected(campaigns.length)}
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
            recordCount={getGridRecordCount(meta.total, displayCampaigns.length, infiniteScrollEnabled)}
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
          data={campaigns}
          cardData={infiniteScrollEnabled ? displayCampaigns : undefined}
          getRowKey={(campaign) => campaign.id}
          loading={loading}
          emptyMessage="Nenhuma campanha criada ainda."
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
          isRowSelected={(campaign) => grid.selected.includes(campaign.id)}
          onRowClick={(campaign, event) =>
            grid.selectRow(campaign.id, {
              shift: event.shiftKey,
              rangeOrder: campaigns.map((item) => item.id),
            })
          }
          onRowDoubleClick={(campaign) => handleViewCampaign(campaign.id)}
        />
      </GridPanel>

      <AlertDialog open={cancelId !== null} onOpenChange={(open) => !open && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogPanelTitle icon={X}>Cancelar campanha</AlertDialogPanelTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar esta campanha?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction onClick={() => void handleCancel()} disabled={isCancelling}>
              Cancelar campanha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={grid.deleteIds.length > 0}
        onOpenChange={(open) => !open && grid.clearDeleteRequest()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogPanelTitle icon={Trash2}>
              {grid.deleteIds.length === 1
                ? 'Remover campanha'
                : `Remover ${grid.deleteIds.length} campanhas`}
            </AlertDialogPanelTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel />
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
