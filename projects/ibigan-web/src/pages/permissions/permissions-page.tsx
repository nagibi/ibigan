import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { GRID_VIEW_ICON } from '@/lib/grid-view-action';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useGridColumnLabels } from '@/hooks/use-grid-column-labels';
import { useGridToasts } from '@/hooks/use-grid-toasts';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridExport } from '@/hooks/use-grid-export';
import {
  formatPermissionAction,
  formatPermissionName,
  formatPermissionResource,
} from '@/lib/role-permission-labels';
import { permissionsService, type Permission } from '@/services/permissions.service';
import { useAuthStore } from '@/stores/auth.store';
import { PageBody } from '@/components/common/page-body';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridPanel } from '@/components/grid/grid-panel';
import { getGridRecordCount } from '@/components/grid/grid-record-count';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridRowActions, type GridRowAction } from '@/components/grid/grid-row-actions';
import { GridTable } from '@/components/grid/grid-table';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { GridViewModeControl } from '@/components/grid/grid-view-mode-control';
import { DataView } from '@/components/grid/data-view';
import { GridCardsView, GridListView } from '@/components/grid/grid-cards-view';
import { PermissionCard } from '@/components/cards/permission-card';
import { useViewMode } from '@/hooks/use-view-mode';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClientGridInfiniteScroll } from '@/hooks/use-grid-infinite-scroll';
import { shouldUseGridInfiniteScroll } from '@/lib/grid-infinite-scroll';
import { VIEW_PREFERENCE_KEYS } from '@/types/view-mode';
import { GridBadge } from '@/components/grid/grid-badge';
import { Checkbox } from '@/components/ui/checkbox';
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

const GRID_COLUMNS_KEY = 'grid-columns:permissions';

export function PermissionsPage() {
  const { t } = useTranslation();
  const cols = useGridColumnLabels();
  const gridToasts = useGridToasts();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useApiToolbarAlert();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('permissao-gerenciar');
  const grid = useGrid();
  const { viewMode, setViewMode } = useViewMode(VIEW_PREFERENCE_KEYS.permissions);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsService.list(),
  });

  const permissions = data?.data.result ?? [];

  const filteredPermissions = useMemo(() => {
    const q = grid.debouncedSearch.trim().toLowerCase();
    if (!q) return permissions;

    return permissions.filter((permission) =>
      permission.name.toLowerCase().includes(q)
      || formatPermissionName(permission.name).toLowerCase().includes(q)
      || permission.resource.toLowerCase().includes(q),
    );
  }, [grid.debouncedSearch, permissions]);

  const isMobile = useIsMobile();
  const infiniteScrollEnabled = shouldUseGridInfiniteScroll(isMobile, viewMode);
  const clientInfinite = useClientGridInfiniteScroll({
    items: filteredPermissions,
    page: grid.page,
    perPage: grid.perPage,
    setPage: grid.setPage,
    enabled: infiniteScrollEnabled,
    resetDeps: [grid.debouncedSearch, filteredPermissions.length],
  });
  const cardListPermissions = infiniteScrollEnabled ? clientInfinite.displayItems : filteredPermissions;

  const permissionIds = useMemo(
    () => filteredPermissions.map((permission) => permission.id),
    [filteredPermissions],
  );

  const handleEditSelected = useCallback(() => {
    if (!grid.singleSelection) return;
    navigate(`/permissions/${grid.selected[0]}`);
  }, [grid.selected, grid.singleSelection, navigate]);

  const handleDeleteSelected = useCallback(() => {
    if (!grid.hasSelection) return;
    grid.requestDelete(grid.selected);
  }, [grid.hasSelection, grid.requestDelete, grid.selected]);

  const handleEscape = useCallback(() => {
    if (grid.deleteIds.length > 0) {
      grid.clearDeleteRequest();
      return;
    }
    if (grid.hasSelection) {
      grid.clearSelection();
    }
  }, [grid.clearDeleteRequest, grid.clearSelection, grid.deleteIds.length, grid.hasSelection]);

  useGridKeyboard({
    canEdit: grid.singleSelection,
    canDelete: grid.hasSelection,
    onEdit: handleEditSelected,
    onDelete: handleDeleteSelected,
    onEscape: handleEscape,
  });

  const handleDelete = useCallback(async () => {
    if (grid.deleteIds.length === 0) return;

    try {
      setIsDeleting(true);
      await Promise.all(grid.deleteIds.map((id) => permissionsService.destroy(id)));
      await queryClient.invalidateQueries({ queryKey: ['permissions'] });
      showSuccess(
        grid.deleteIds.length === 1
          ? t('permissions.success.deleted_one')
          : t('permissions.success.deleted_many'),
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
    } catch (error) {
      showError(t('permissions.error.delete'), error);
    } finally {
      setIsDeleting(false);
    }
  }, [grid, queryClient, showError, showSuccess, t]);

  const handleEditPermission = useCallback(
    (permissionId: number) => navigate(`/permissions/${permissionId}`),
    [navigate],
  );

  const getPermissionRowActions = useCallback(
    (permission: Permission): GridRowAction[] => [
      {
        label: cols.edit,
        icon: GRID_VIEW_ICON,
        onClick: () => handleEditPermission(permission.id),
      },
      ...(canManage
        ? [{
            label: cols.remove,
            icon: Trash2,
            tone: 'destructive' as const,
            onClick: () => grid.requestDelete([permission.id]),
          }]
        : []),
    ],
    [canManage, cols.edit, cols.remove, grid.requestDelete, handleEditPermission],
  );

  const columnDefinitions = useMemo<GridColumnDef<Permission>[]>(
    () => [
      ...(canManage
        ? [{
            id: 'select',
            label: cols.select,
            pinned: 'start' as const,
            hideable: false,
            className: 'w-[40px]',
            render: (permission: Permission) => (
              <Checkbox
                checked={grid.selected.includes(permission.id)}
                onCheckedChange={() => grid.toggleSelect(permission.id)}
                onClick={(event) => event.stopPropagation()}
              />
            ),
          }]
        : []),
      {
        id: 'id',
        label: cols.id,
        className: 'w-[70px] text-sm text-muted-foreground',
        render: (permission) => permission.id,
      },
      {
        id: 'actions',
        label: cols.actions,
        hideable: false,
        className: 'min-w-[100px] w-[100px]',
        render: (permission) => (
          <GridRowActions actions={getPermissionRowActions(permission)} />
        ),
      },
      {
        id: 'name',
        label: t('permissions.column.name'),
        className: 'min-w-[220px]',
        render: (permission) => (
          <div>
            <p className="font-medium">{formatPermissionName(permission.name)}</p>
            <p className="text-xs text-muted-foreground">{permission.name}</p>
          </div>
        ),
      },
      {
        id: 'resource',
        label: t('permissions.column.resource'),
        className: 'w-[140px]',
        render: (permission) => (
          <GridBadge variant="outline">{formatPermissionResource(permission.resource)}</GridBadge>
        ),
      },
      {
        id: 'action',
        label: t('permissions.column.action'),
        className: 'w-[120px]',
        render: (permission) => (
          <GridBadge variant="secondary">{formatPermissionAction(permission.action)}</GridBadge>
        ),
      },
    ],
    [canManage, cols, getPermissionRowActions, grid.selected, grid.toggleSelect, handleEditPermission, t],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const exportPermissions = infiniteScrollEnabled ? cardListPermissions : filteredPermissions;

  const { handleExport, isExporting } = useGridExport({
    filename: 'permissoes',
    columns: gridColumns.visibleColumns,
    rows: exportPermissions,
  });

  const activeFilters = useMemo(() => {
    if (!grid.search.trim()) return [];

    return [{
      id: 'search',
      label: cols.search,
      value: grid.search.trim(),
      onRemove: grid.clearSearch,
    }];
  }, [cols.search, grid.clearSearch, grid.search]);

  const hasActiveFilters = activeFilters.length > 0;
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  function handleClearFilters() {
    grid.clearSearch();
    gridToasts.filtersCleared();
  }

  function handleResetGrid() {
    gridColumns.resetColumns();
    grid.resetSettings();
    grid.clearSearch();
    grid.clearSelection();
    gridToasts.gridRestored();
  }

  const toolbarActions = useMemo(
    () => (canManage ? (
      <StandardGridToolbar
        onNew={() => navigate('/permissions/new')}
        onEdit={handleEditSelected}
        onDelete={handleDeleteSelected}
        onExport={handleExport}
        isExporting={isExporting}
        hasSelection={grid.hasSelection}
        singleSelection={grid.singleSelection}
      />
    ) : undefined),
    [
      canManage,
      grid.hasSelection,
      grid.singleSelection,
      handleDeleteSelected,
      handleEditSelected,
      handleExport,
      isExporting,
      navigate,
    ],
  );

  usePageToolbar({
    title: t('permissions.title'),
    description: t('permissions.description'),
    actions: toolbarActions,
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={(
          <GridPanelToolbar
            onSelectAll={canManage ? () => grid.toggleSelectAll(permissionIds) : undefined}
            isAllSelected={grid.isAllSelected(permissionIds.length)}
            selectedCount={grid.selected.length}
            onClearSelection={grid.clearSelection}
            onRefresh={() => void refetch()}
            isRefreshing={isLoading || isFetching}
            onExport={handleExport}
            isExporting={isExporting}
            search={grid.search}
            onSearch={grid.setSearch}
            filters={{
              active: activeFilters,
              onClearAll: hasActiveFilters ? handleClearFilters : undefined,
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
                  gridToasts.columnsRestored();
                }}
              />
            )}
            resetControl={(
              <GridResetControl
                disabled={!isGridCustomized}
                onReset={handleResetGrid}
              />
            )}
            viewModeControl={
              <GridViewModeControl viewMode={viewMode} onViewModeChange={setViewMode} />
            }
            recordCount={getGridRecordCount(filteredPermissions.length, cardListPermissions.length, infiniteScrollEnabled)}
          />
        )}
      >
        <DataView
          viewMode={viewMode}
          loading={isLoading}
          isEmpty={!isLoading && filteredPermissions.length === 0}
          emptyMessage={t('permissions.empty')}
          infiniteScroll={infiniteScrollEnabled ? {
            enabled: true,
            hasMore: clientInfinite.hasMore,
            onLoadMore: clientInfinite.loadMore,
            loadedCount: clientInfinite.loadedCount,
            total: clientInfinite.total,
          } : undefined}
          tableView={(
            <GridTable
              columns={gridColumns.visibleColumns}
              data={filteredPermissions}
              getRowKey={(permission) => String(permission.id)}
              loading={isLoading}
              emptyMessage={t('permissions.empty')}
              onColumnOrderChange={gridColumns.reorderDraggableColumns}
              isRowSelected={(permission) => grid.selected.includes(permission.id)}
              onRowClick={(permission, event) => {
                if (!canManage) {
                  handleEditPermission(permission.id);
                  return;
                }
                grid.selectRow(permission.id, {
                  shift: event.shiftKey,
                  rangeOrder: permissionIds,
                });
              }}
              onRowDoubleClick={(permission) => handleEditPermission(permission.id)}
            />
          )}
          listView={(
            <GridListView
              data={cardListPermissions}
              getRowKey={(permission) => String(permission.id)}
              isRowSelected={(permission) => grid.selected.includes(permission.id)}
              onRowClick={(permission) => {
                if (!canManage) {
                  handleEditPermission(permission.id);
                  return;
                }
                grid.selectRow(permission.id, { rangeOrder: permissionIds });
              }}
              onRowDoubleClick={(permission) => handleEditPermission(permission.id)}
              renderItem={(permission) => (
                <PermissionCard
                  permission={permission}
                  actions={getPermissionRowActions(permission)}
                />
              )}
            />
          )}
          cardView={(
            <GridCardsView
              data={cardListPermissions}
              getRowKey={(permission) => String(permission.id)}
              isRowSelected={(permission) => grid.selected.includes(permission.id)}
              onRowClick={(permission) => {
                if (!canManage) {
                  handleEditPermission(permission.id);
                  return;
                }
                grid.selectRow(permission.id, { rangeOrder: permissionIds });
              }}
              onRowDoubleClick={(permission) => handleEditPermission(permission.id)}
              renderCard={(permission) => (
                <PermissionCard
                  permission={permission}
                  actions={getPermissionRowActions(permission)}
                />
              )}
            />
          )}
        />
      </GridPanel>

      <AlertDialog open={grid.deleteIds.length > 0} onOpenChange={grid.clearDeleteRequest}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogPanelTitle icon={Trash2}>
              {grid.deleteIds.length === 1
                ? t('permissions.delete.title_one')
                : t('permissions.delete.title_many', { count: grid.deleteIds.length })}
            </AlertDialogPanelTitle>
            <AlertDialogDescription>
              {t('permissions.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {t('common.remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageBody>
  );
}
