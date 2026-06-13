import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { GRID_VIEW_ICON } from '@/lib/grid-view-action';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useGridColumnLabels } from '@/hooks/use-grid-column-labels';
import { useGridToasts } from '@/hooks/use-grid-toasts';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import { useSyncGridUrl } from '@/hooks/use-sync-grid-url';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { parseGridUrlState } from '@/lib/grid-url-state';
import {
  clearRolesUserFilterParams,
  parseRolesUserFilter,
} from '@/lib/roles-user-filter';
import { formatRoleName } from '@/lib/role-permission-labels';
import { rolesService, type Role } from '@/services/roles.service';
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
import { RoleCard } from '@/components/cards/role-card';
import { useViewMode } from '@/hooks/use-view-mode';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClientGridInfiniteScroll } from '@/hooks/use-grid-infinite-scroll';
import { shouldUseGridInfiniteScroll } from '@/lib/grid-infinite-scroll';
import { VIEW_PREFERENCE_KEYS } from '@/types/view-mode';
import { GridBadge } from '@/components/grid/grid-badge';
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

const GRID_COLUMNS_KEY = 'grid-columns:roles';

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), "dd/MM/yy 'às' HH:mm", { locale: ptBR });
}

function isRoleDeletable(role: Role) {
  return !role.is_system && role.users_count === 0;
}

export function RolesPage() {
  const { t } = useTranslation();
  const cols = useGridColumnLabels();
  const gridToasts = useGridToasts();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useApiToolbarAlert();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('permissao-gerenciar');
  const initialUrlState = useRef(parseGridUrlState(searchParams)).current;
  const grid = useGrid({ defaultSearch: initialUrlState.search });
  const { viewMode, setViewMode } = useViewMode(VIEW_PREFERENCE_KEYS.roles);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesService.list(),
  });

  const roles = data?.data.result ?? [];
  const userFilter = useMemo(
    () => parseRolesUserFilter(searchParams),
    [searchParams],
  );

  const clearUserFilter = useCallback(() => {
    const next = clearRolesUserFilterParams(searchParams);
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useSyncGridUrl({
    debouncedSearch: grid.debouncedSearch,
    userFilter,
    syncPagination: false,
    syncSort: false,
    syncColumnFilters: false,
  });

  const filteredRoles = useMemo(() => {
    let result = roles;

    if (userFilter) {
      const roleNames = new Set(userFilter.roleNames);
      result = roleNames.size > 0
        ? result.filter((role) => roleNames.has(role.name))
        : [];
    }

    const q = grid.debouncedSearch.trim().toLowerCase();
    if (!q) return result;

    return result.filter((role) =>
      role.name.toLowerCase().includes(q)
      || formatRoleName(role.name).toLowerCase().includes(q),
    );
  }, [grid.debouncedSearch, roles, userFilter]);

  const isMobile = useIsMobile();
  const infiniteScrollEnabled = shouldUseGridInfiniteScroll(isMobile, viewMode);
  const clientInfinite = useClientGridInfiniteScroll({
    items: filteredRoles,
    page: grid.page,
    perPage: grid.perPage,
    setPage: grid.setPage,
    enabled: infiniteScrollEnabled,
    resetDeps: [grid.debouncedSearch, userFilter, filteredRoles.length],
  });
  const cardListRoles = infiniteScrollEnabled ? clientInfinite.displayItems : filteredRoles;

  const deletableSelectedIds = useMemo(
    () => grid.selected.filter((id) => {
      const role = roles.find((item) => item.id === id);
      return role ? isRoleDeletable(role) : false;
    }),
    [grid.selected, roles],
  );

  const selectableIds = useMemo(
    () => filteredRoles.map((role) => role.id),
    [filteredRoles],
  );

  const handleEditSelected = useCallback(() => {
    if (!grid.singleSelection) return;
    navigate(`/roles/${grid.selected[0]}`);
  }, [grid.selected, grid.singleSelection, navigate]);

  const handleDeleteSelected = useCallback(() => {
    if (deletableSelectedIds.length === 0) return;
    grid.requestDelete(deletableSelectedIds);
  }, [deletableSelectedIds, grid.requestDelete]);

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
    canDelete: deletableSelectedIds.length > 0,
    onEdit: handleEditSelected,
    onDelete: handleDeleteSelected,
    onEscape: handleEscape,
  });

  const handleDelete = useCallback(async () => {
    if (grid.deleteIds.length === 0) return;

    try {
      setIsDeleting(true);
      await Promise.all(grid.deleteIds.map((id) => rolesService.destroy(id)));
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      showSuccess(
        grid.deleteIds.length === 1
          ? t('roles.success.deleted_one')
          : t('roles.success.deleted_many'),
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
    } catch (error) {
      showError(t('roles.error.delete'), error);
    } finally {
      setIsDeleting(false);
    }
  }, [grid, queryClient, showError, showSuccess, t]);

  const handleEditRole = useCallback(
    (roleId: number) => navigate(`/roles/${roleId}`),
    [navigate],
  );

  const getRoleRowActions = useCallback(
    (role: Role): GridRowAction[] => [
      {
        label: cols.edit,
        icon: GRID_VIEW_ICON,
        onClick: () => handleEditRole(role.id),
      },
      ...(canManage && isRoleDeletable(role)
        ? [{
            label: cols.remove,
            icon: Trash2,
            tone: 'destructive' as const,
            onClick: () => grid.requestDelete([role.id]),
          }]
        : []),
    ],
    [canManage, cols.edit, cols.remove, grid.requestDelete, handleEditRole],
  );

  const columnDefinitions = useMemo<GridColumnDef<Role>[]>(
    () => [
      ...(canManage
        ? [{
            id: 'select',
            label: cols.select,
            pinned: 'start' as const,
            hideable: false,
            className: 'w-[40px]',
            render: (role: Role) => (
              <Checkbox
                checked={grid.selected.includes(role.id)}
                onCheckedChange={() => grid.toggleSelect(role.id)}
                onClick={(event) => event.stopPropagation()}
              />
            ),
          }]
        : []),
      {
        id: 'id',
        label: cols.id,
        className: 'w-[70px] text-sm text-muted-foreground',
        render: (role) => role.id,
      },
      {
        id: 'actions',
        label: cols.actions,
        hideable: false,
        className: 'w-[72px]',
        render: (role) => (
          <GridRowActions actions={getRoleRowActions(role)} />
        ),
      },
      {
        id: 'name',
        label: t('roles.column.name'),
        className: 'min-w-[180px]',
        render: (role) => (
          <div>
            <p className="font-medium">{formatRoleName(role.name)}</p>
            <p className="text-xs text-muted-foreground">{role.name}</p>
          </div>
        ),
      },
      {
        id: 'type',
        label: t('roles.column.type'),
        className: 'w-[120px]',
        render: (role) => (
          <GridBadge variant={role.is_system ? 'outline' : 'secondary'}>
            {role.is_system ? t('roles.type.system') : t('roles.type.custom')}
          </GridBadge>
        ),
      },
      {
        id: 'permissions',
        label: t('roles.column.permissions'),
        className: 'w-[110px] text-sm text-muted-foreground',
        render: (role) => role.permissions.length,
      },
      {
        id: 'users_count',
        label: t('roles.column.users'),
        className: 'w-[90px] text-sm text-muted-foreground',
        render: (role) => role.users_count,
      },
      {
        id: 'created_at',
        label: t('roles.column.created_at'),
        className: 'w-[150px] text-sm text-muted-foreground whitespace-nowrap',
        render: (role) => formatDateTime(role.created_at),
      },
    ],
    [canManage, cols, getRoleRowActions, grid.selected, grid.toggleSelect, handleEditRole, t],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const activeFilters = useMemo(() => {
    const items = [];

    if (userFilter) {
      items.push({
        id: 'user',
        label: t('roles.filter.associated_roles'),
        value: userFilter.userName,
        onRemove: clearUserFilter,
      });
    }

    if (grid.search.trim()) {
      items.push({
        id: 'search',
        label: cols.search,
        value: grid.search.trim(),
        onRemove: grid.clearSearch,
      });
    }

    return items;
  }, [clearUserFilter, cols.search, grid.clearSearch, grid.search, t, userFilter]);

  const hasActiveFilters = activeFilters.length > 0;
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  const emptyMessage = userFilter
    ? userFilter.roleNames.length === 0
      ? t('roles.empty.user_no_roles')
      : t('roles.empty.user_filtered')
    : t('roles.empty');

  function handleClearFilters() {
    grid.clearSearch();
    clearUserFilter();
    gridToasts.filtersCleared();
  }

  function handleResetGrid() {
    gridColumns.resetColumns();
    grid.resetSettings();
    grid.clearSearch();
    clearUserFilter();
    grid.clearSelection();
    gridToasts.gridRestored();
  }

  function handleExport() {
    gridToasts.exportSoon();
  }

  const toolbarActions = useMemo(
    () => (canManage ? (
      <StandardGridToolbar
        onNew={() => navigate('/roles/new')}
        onEdit={handleEditSelected}
        onDelete={handleDeleteSelected}
        hasSelection={deletableSelectedIds.length > 0}
        singleSelection={grid.singleSelection}
      />
    ) : undefined),
    [
      canManage,
      deletableSelectedIds.length,
      grid.singleSelection,
      handleDeleteSelected,
      handleEditSelected,
      navigate,
    ],
  );

  usePageToolbar({
    title: t('roles.title'),
    description: t('roles.description'),
    actions: toolbarActions,
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={(
          <GridPanelToolbar
            onSelectAll={canManage ? () => grid.toggleSelectAll(selectableIds) : undefined}
            isAllSelected={grid.isAllSelected(selectableIds.length)}
            selectedCount={grid.selected.length}
            onClearSelection={grid.clearSelection}
            onRefresh={() => void refetch()}
            isRefreshing={isLoading || isFetching}
            onExport={handleExport}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder={t('roles.search_placeholder')}
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
            recordCount={getGridRecordCount(filteredRoles.length, cardListRoles.length, infiniteScrollEnabled)}
          />
        )}
      >
        <DataView
          viewMode={viewMode}
          loading={isLoading}
          isEmpty={!isLoading && filteredRoles.length === 0}
          emptyMessage={emptyMessage}
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
              data={filteredRoles}
              getRowKey={(role) => String(role.id)}
              loading={isLoading}
              emptyMessage={emptyMessage}
              onColumnOrderChange={gridColumns.reorderDraggableColumns}
              isRowSelected={(role) => grid.selected.includes(role.id)}
              onRowClick={(role, event) => {
                if (!canManage) {
                  handleEditRole(role.id);
                  return;
                }
                grid.selectRow(role.id, {
                  shift: event.shiftKey,
                  rangeOrder: filteredRoles.map((item) => item.id),
                });
              }}
              onRowDoubleClick={(role) => handleEditRole(role.id)}
            />
          )}
          listView={(
            <GridListView
              data={cardListRoles}
              getRowKey={(role) => String(role.id)}
              isRowSelected={(role) => grid.selected.includes(role.id)}
              onRowClick={(role) => {
                if (!canManage) {
                  handleEditRole(role.id);
                  return;
                }
                grid.selectRow(role.id, { rangeOrder: filteredRoles.map((item) => item.id) });
              }}
              renderItem={(role) => (
                <RoleCard
                  role={role}
                  actions={getRoleRowActions(role)}
                />
              )}
            />
          )}
          cardView={(
            <GridCardsView
              data={cardListRoles}
              getRowKey={(role) => String(role.id)}
              isRowSelected={(role) => grid.selected.includes(role.id)}
              onRowClick={(role) => {
                if (!canManage) {
                  handleEditRole(role.id);
                  return;
                }
                grid.selectRow(role.id, { rangeOrder: filteredRoles.map((item) => item.id) });
              }}
              renderCard={(role) => (
                <RoleCard
                  role={role}
                  actions={getRoleRowActions(role)}
                />
              )}
            />
          )}
        />
      </GridPanel>

      <AlertDialog open={grid.deleteIds.length > 0} onOpenChange={grid.clearDeleteRequest}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {grid.deleteIds.length === 1
                ? t('roles.delete.title_one')
                : t('roles.delete.title_many', { count: grid.deleteIds.length })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('roles.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
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
