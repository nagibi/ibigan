import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { History, ShieldCheck, Trash2 } from 'lucide-react';
import { GRID_VIEW_ICON } from '@/lib/grid-view-action';
import { getColumnFilterDisplayValue } from '@/lib/grid-filter-display';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useSyncGridUrl } from '@/hooks/use-sync-grid-url';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import { useGridColumnLabels } from '@/hooks/use-grid-column-labels';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridExport } from '@/hooks/use-grid-export';
import { useGridToasts } from '@/hooks/use-grid-toasts';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import {
  dateRangeFilterFromKey,
  dateRangeFilterToKey,
  useGridFilters,
} from '@/hooks/use-grid-filters';
import { ActivityLogsSheet } from '@/components/activity-logs/activity-logs-sheet';
import { TOGGLE_ACTIVE_LABELS } from '@/lib/toggle-active-alert';
import { formatCpf, formatPhone } from '@/lib/brazilian-masks';
import { formatUserGender, getUserGenderOptions } from '@/lib/user-gender';
import { parseGridUrlState } from '@/lib/grid-url-state';
import { buildRolesUrlWithUserFilter } from '@/lib/roles-user-filter';
import { isUserActive, usersService, type User } from '@/services/users.service';
import { useAuthStore } from '@/stores/auth.store';
import { formatDateRangeFilterLabel } from '@/components/grid/grid-date-range-filter';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { getGridRecordCount } from '@/components/grid/grid-record-count';
import { GridPagination, type GridPaginationMeta } from '@/components/grid/grid-pagination';
import { GridTable } from '@/components/grid/grid-table';
import { GridRowActions, type GridRowAction } from '@/components/grid/grid-row-actions';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { GridViewModeControl } from '@/components/grid/grid-view-mode-control';
import { DataView } from '@/components/grid/data-view';
import { GridCardsView, GridListView } from '@/components/grid/grid-cards-view';
import { UserCard } from '@/components/cards/user-card';
import { useViewMode } from '@/hooks/use-view-mode';
import { useIsMobile } from '@/hooks/use-mobile';
import { useGridInfiniteScroll } from '@/hooks/use-grid-infinite-scroll';
import { shouldUseGridInfiniteScroll } from '@/lib/grid-infinite-scroll';
import { VIEW_PREFERENCE_KEYS } from '@/types/view-mode';
import { getInitials } from '@/lib/helpers';
import { GridBadge } from '@/components/grid/grid-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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

const USER_ACTIVITY_LOG_TYPE = 'users';
const GRID_COLUMNS_KEY = 'grid-columns:users';

function formatAuditDate(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), 'dd/MM/yy HH:mm', { locale: ptBR });
}

function formatBirthDate(value?: string | null) {
  if (!value) return '—';
  return format(new Date(`${value}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR });
}

function truncateText(value?: string | null, max = 60) {
  if (!value) return '—';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function getAuditUserName(
  user: User,
  field: 'created_by' | 'updated_by',
) {
  const ref = user[field];
  if (ref?.name) return ref.name;

  const flatName = field === 'created_by' ? user.created_by_name : user.updated_by_name;
  return flatName ?? '—';
}

export function UsersPage() {
  const { t } = useTranslation();
  const cols = useGridColumnLabels();
  const gridToasts = useGridToasts();
  const statusFilterOptions = useMemo(
    () => [
      { label: t('status.active'), value: 'active' },
      { label: t('status.inactive'), value: 'inactive' },
    ],
    [t],
  );
  const genderFilterOptions = useMemo(() => getUserGenderOptions(), [t]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialUrlState = useRef(parseGridUrlState(searchParams)).current;
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const { hasPermission } = useAuthStore();
  const canViewRoles = hasPermission('permissao-visualizar');
  const { showToggleActive, showError, showSuccess } = useApiToolbarAlert();
  const { viewMode, setViewMode } = useViewMode(VIEW_PREFERENCE_KEYS.users);

  const grid = useGrid({
    defaultPage: initialUrlState.page,
    defaultPerPage: initialUrlState.perPage,
    defaultSearch: initialUrlState.search,
    defaultSort: initialUrlState.sort,
    defaultSortDir: initialUrlState.sortDir,
    onActivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => usersService.toggleActive(id, true)));
        showToggleActive(true, TOGGLE_ACTIVE_LABELS.user, ids.length);
        await loadRef.current();
      } catch (error) {
        showError(t('users.error.activate'), error);
        throw new Error('toggle-active-failed');
      }
    },
    onDeactivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => usersService.toggleActive(id, false)));
        showToggleActive(false, TOGGLE_ACTIVE_LABELS.user, ids.length);
        await loadRef.current();
      } catch (error) {
        showError(t('users.error.deactivate'), error);
        throw new Error('toggle-active-failed');
      }
    },
  });

  const columnFilters = useGridFilters(() => grid.setPage(1), {
    defaultFilters: initialUrlState.filters,
  });

  useSyncGridUrl({
    page: grid.page,
    perPage: grid.perPage,
    debouncedSearch: grid.debouncedSearch,
    sort: grid.sort,
    sortDir: grid.sortDir,
    debouncedFilters: columnFilters.debouncedFilters,
  });

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<GridPaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activityLogUser, setActivityLogUser] = useState<User | null>(null);
  const [rowStatusId, setRowStatusId] = useState<number | null>(null);
  const isMobile = useIsMobile();
  const infiniteScrollEnabled = shouldUseGridInfiniteScroll(isMobile, viewMode);
  const infiniteScroll = useGridInfiniteScroll<User>({
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
      const res = await usersService.list(
        grid.page,
        grid.resolvePerPage(meta.total),
        grid.debouncedSearch,
        grid.sort,
        grid.sortDir,
        columnFilters.activeFilterParams,
      );
      const pageUsers = res.data.result.data;
      setUsers(pageUsers);
      infiniteScroll.receivePage(pageUsers, grid.page);
      setMeta(res.data.result.meta);
    } catch (error) {
      showError(t('users.error.load'), error);
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
    t,
  ]);

  const displayUsers = infiniteScrollEnabled ? infiniteScroll.items : users;

  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  const handleEditSelected = useCallback(() => {
    if (!grid.singleSelection) return;
    navigate(`/users/${grid.selected[0]}`);
  }, [grid.singleSelection, grid.selected, navigate]);

  const handleDeleteSelected = useCallback(() => {
    if (!grid.hasSelection) return;
    grid.requestDelete(grid.selected);
  }, [grid.hasSelection, grid.requestDelete, grid.selected]);

  const handleEscape = useCallback(() => {
    if (activityLogUser !== null) {
      setActivityLogUser(null);
    }
    if (grid.deleteIds.length > 0) {
      grid.clearDeleteRequest();
    }
    if (grid.hasSelection) {
      grid.clearSelection();
    }
  }, [
    activityLogUser,
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
      await Promise.all(grid.deleteIds.map((id) => usersService.destroy(id)));
      showSuccess(
        grid.deleteIds.length === 1
          ? t('users.success.deleted_one')
          : t('users.success.deleted_many', { count: grid.deleteIds.length }),
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
      void load();
    } catch (error) {
      showError(t('users.error.delete'), error);
    } finally {
      setIsDeleting(false);
    }
  }

  const handleEditUser = useCallback(
    (userId: number) => navigate(`/users/${userId}`),
    [navigate],
  );

  const handleViewUserRoles = useCallback(
    (user: User) => navigate(buildRolesUrlWithUserFilter(user)),
    [navigate],
  );

  const getUserRowActions = useCallback(
    (user: User): GridRowAction[] => [
      {
        label: cols.edit,
        icon: GRID_VIEW_ICON,
        onClick: () => navigate(`/users/${user.id}`),
      },
      {
        label: t('users.column.roles'),
        icon: ShieldCheck,
        hidden: !canViewRoles,
        onClick: () => handleViewUserRoles(user),
      },
      {
        label: t('form.activity_log'),
        icon: History,
        onClick: () => setActivityLogUser(user),
      },
    ],
    [canViewRoles, cols.edit, handleViewUserRoles, navigate, t],
  );

  async function handleRowStatusChange(user: User, active: boolean) {
    const currentlyActive = isUserActive(user);
    if (currentlyActive === active) return;

    try {
      setRowStatusId(user.id);
      await usersService.toggleActive(user.id, active);
      showToggleActive(active, TOGGLE_ACTIVE_LABELS.user);
      void load();
    } catch (error) {
      showError(t('users.error.update_status'), error);
    } finally {
      setRowStatusId(null);
    }
  }

  const columnDefinitions = useMemo<GridColumnDef<User>[]>(
    () => [
      {
        id: 'select',
        label: cols.select,
        pinned: 'start',
        hideable: false,
        className: 'w-[40px]',
        render: (user) => (
          <Checkbox
            checked={grid.selected.includes(user.id)}
            onCheckedChange={() => grid.toggleSelect(user.id)}
            onClick={(event) => event.stopPropagation()}
          />
        ),
      },
      {
        id: 'id',
        label: cols.id,
        sortable: true,
        sortKey: 'id',
        filter: { type: 'multi', filterKey: 'id', placeholder: cols.id, inputMode: 'numeric' },
        className: 'w-[70px] text-sm text-muted-foreground',
        render: (user) => user.id,
      },
      {
        id: 'actions',
        label: cols.actions,
        hideable: false,
        className: 'min-w-[100px] w-[100px]',
        render: (user) => (
          <GridRowActions actions={getUserRowActions(user)} />
        ),
      },
      {
        id: 'active',
        label: cols.active,
        sortable: true,
        sortKey: 'status',
        filter: {
          type: 'select',
          filterKey: 'status',
          placeholder: cols.all,
          options: statusFilterOptions,
        },
        className: 'w-[80px]',
        exportValue: (user) => (isUserActive(user) ? 'Ativo' : 'Inativo'),
        render: (user) => (
          <Switch
            checked={isUserActive(user)}
            disabled={rowStatusId === user.id}
            onCheckedChange={(checked) => void handleRowStatusChange(user, checked)}
          />
        ),
      },
      {
        id: 'user',
        label: t('users.column.user'),
        sortable: true,
        sortKey: 'name',
        filter: { type: 'multi', filterKey: 'user', placeholder: t('users.filter.name_or_email') },
        className: 'min-w-[240px] w-[280px]',
        render: (user) => (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-8 shrink-0">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {getInitials(user.name, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        ),
      },
      {
        id: 'roles',
        label: t('users.column.role'),
        filter: { type: 'text', filterKey: 'role', placeholder: t('users.column.role') },
        className: 'min-w-[120px] w-[140px]',
        render: (user) => (
          <div className="flex min-w-0 flex-wrap gap-1">
            {user.roles.map((role) => (
              <GridBadge key={role} variant="outline">
                {role}
              </GridBadge>
            ))}
          </div>
        ),
      },
      {
        id: 'cpf',
        label: t('users.column.cpf'),
        sortable: true,
        sortKey: 'cpf',
        filter: { type: 'text', filterKey: 'cpf', placeholder: t('users.column.cpf'), mask: 'cpf' },
        className: 'min-w-[130px] text-sm whitespace-nowrap',
        render: (user) => formatCpf(user.cpf) || '—',
      },
      {
        id: 'phone',
        label: t('users.column.phone'),
        sortable: true,
        sortKey: 'phone',
        filter: { type: 'text', filterKey: 'phone', placeholder: t('users.column.phone'), mask: 'phone' },
        className: 'min-w-[130px] text-sm whitespace-nowrap',
        render: (user) => formatPhone(user.phone) || '—',
      },
      {
        id: 'birth_date',
        label: t('users.column.birth_date'),
        sortable: true,
        sortKey: 'birth_date',
        filter: { type: 'dateRange', filterKey: 'birth_date' },
        className: 'min-w-[120px] text-sm text-muted-foreground whitespace-nowrap',
        render: (user) => formatBirthDate(user.birth_date),
      },
      {
        id: 'gender',
        label: t('users.column.gender'),
        sortable: true,
        sortKey: 'gender',
        filter: {
          type: 'select',
          filterKey: 'gender',
          placeholder: cols.all,
          options: genderFilterOptions,
        },
        className: 'min-w-[150px] text-sm',
        render: (user) => formatUserGender(user.gender),
      },
      {
        id: 'bio',
        label: t('users.column.bio'),
        filter: { type: 'text', filterKey: 'bio', placeholder: t('users.column.bio') },
        className: 'min-w-[180px] text-sm text-muted-foreground',
        render: (user) => truncateText(user.bio),
      },
      {
        id: 'last_login_at',
        label: t('users.column.last_login_at'),
        sortable: true,
        sortKey: 'last_login_at',
        filter: { type: 'dateRange', filterKey: 'last_login_at' },
        className: 'min-w-[150px] text-sm text-muted-foreground whitespace-nowrap',
        render: (user) => formatAuditDate(user.last_login_at),
      },
      {
        id: 'last_login_ip',
        label: t('users.column.last_login_ip'),
        filter: { type: 'text', filterKey: 'last_login_ip', placeholder: t('users.column.last_login_ip') },
        className: 'min-w-[130px] text-sm text-muted-foreground font-mono text-xs',
        render: (user) => user.last_login_ip ?? '—',
      },
      {
        id: 'last_login_device',
        label: t('users.column.last_login_device'),
        filter: { type: 'text', filterKey: 'last_login_device', placeholder: t('users.column.last_login_device') },
        className: 'min-w-[180px] text-sm text-muted-foreground',
        render: (user) => truncateText(user.last_login_device, 40),
      },
      {
        id: 'created_at',
        label: cols.createdAt,
        sortable: true,
        sortKey: 'created_at',
        filter: { type: 'dateRange', filterKey: 'created_at' },
        className: 'min-w-[150px] text-sm text-muted-foreground whitespace-nowrap',
        render: (user) => formatAuditDate(user.created_at),
      },
      {
        id: 'created_by',
        label: cols.createdBy,
        filter: { type: 'text', filterKey: 'created_by', placeholder: t('users.column.user') },
        className: 'min-w-[160px] text-sm text-muted-foreground',
        render: (user) => getAuditUserName(user, 'created_by'),
      },
      {
        id: 'updated_at',
        label: cols.updatedAt,
        sortable: true,
        sortKey: 'updated_at',
        filter: { type: 'dateRange', filterKey: 'updated_at' },
        className: 'min-w-[160px] text-sm text-muted-foreground whitespace-nowrap',
        render: (user) => formatAuditDate(user.updated_at),
      },
      {
        id: 'updated_by',
        label: cols.updatedBy,
        filter: { type: 'text', filterKey: 'updated_by', placeholder: t('users.column.user') },
        className: 'min-w-[170px] text-sm text-muted-foreground',
        render: (user) => getAuditUserName(user, 'updated_by'),
      },
    ],
    [
      cols,
      genderFilterOptions,
      getUserRowActions,
      grid.selected,
      grid.toggleSelect,
      rowStatusId,
      statusFilterOptions,
      t,
    ],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const { handleExport, isExporting } = useGridExport({
    filename: 'usuarios',
    columns: gridColumns.visibleColumns,
    rows: displayUsers,
  });

  const activeFilters = useMemo(() => {
    const items = [];

    if (grid.search.trim()) {
      items.push({
        id: 'search',
        label: cols.search,
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
    columnFilters.clearDateRangeFilter,
    grid.search,
    grid.clearSearch,
    cols.search,
  ]);

  function handleResetColumns() {
    gridColumns.resetColumns();
    gridToasts.columnsRestored();
  }

  function handleClearFilters() {
    grid.clearSearch();
    columnFilters.clearAllFilters();
    gridToasts.filtersCleared();
  }

  function handleResetGrid() {
    gridColumns.resetColumns();
    grid.clearSearch();
    columnFilters.clearAllFilters();
    grid.resetSettings();
    gridToasts.gridRestored();
  }

  const hasActiveFilters = grid.hasFilters || columnFilters.hasFilters;
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onNew={() => navigate('/users/new')}
        onEdit={handleEditSelected}
        onActivate={() => void grid.activateSelected()}
        onDeactivate={() => void grid.deactivateSelected()}
        onDelete={handleDeleteSelected}
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
    title: t('users.title'),
    description: t('users.description'),
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
            onSelectAll={() => grid.toggleSelectAll(users.map((u) => u.id))}
            isAllSelected={grid.isAllSelected(users.length)}
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
            viewModeControl={
              <GridViewModeControl viewMode={viewMode} onViewModeChange={setViewMode} />
            }
            recordCount={getGridRecordCount(meta.total, displayUsers.length, infiniteScrollEnabled)}
          />
        }
        footer={!infiniteScrollEnabled ? pagination : undefined}
      >
        <DataView
          viewMode={viewMode}
          loading={loading}
          isEmpty={!loading && displayUsers.length === 0}
          emptyMessage={t('users.empty')}
          infiniteScroll={infiniteScrollEnabled ? {
            enabled: true,
            hasMore: infiniteScroll.hasMore,
            loading,
            loadingMore: infiniteScroll.loadingMore,
            onLoadMore: infiniteScroll.loadMore,
            loadedCount: infiniteScroll.loadedCount,
            total: infiniteScroll.total,
          } : undefined}
          tableView={(
            <GridTable
              columns={gridColumns.visibleColumns}
              data={users}
              getRowKey={(user) => user.id}
              loading={loading}
              emptyMessage={t('users.empty')}
              sort={grid.sort}
              sortDir={grid.sortDir}
              onSort={grid.toggleSort}
              onColumnOrderChange={gridColumns.reorderDraggableColumns}
              columnFilters={columnFilters.filters}
              onColumnFilterChange={columnFilters.setFilter}
              onDateRangeFilterChange={columnFilters.setDateRangeFilter}
              onColumnFilterClear={columnFilters.clearColumnFilter}
              isRowSelected={(user) => grid.selected.includes(user.id)}
              onRowClick={(user, event) =>
                grid.selectRow(user.id, {
                  shift: event.shiftKey,
                  rangeOrder: displayUsers.map((item) => item.id),
                })
              }
              onRowDoubleClick={(user) => handleEditUser(user.id)}
            />
          )}
          listView={(
            <GridListView
              data={displayUsers}
              getRowKey={(user) => String(user.id)}
              isRowSelected={(user) => grid.selected.includes(user.id)}
              onRowClick={(user) =>
                grid.selectRow(user.id, { rangeOrder: displayUsers.map((item) => item.id) })
              }
              onRowDoubleClick={(user) => handleEditUser(user.id)}
              renderItem={(user) => (
                <UserCard
                  user={user}
                  actions={getUserRowActions(user)}
                />
              )}
            />
          )}
          cardView={(
            <GridCardsView
              data={displayUsers}
              getRowKey={(user) => String(user.id)}
              isRowSelected={(user) => grid.selected.includes(user.id)}
              onRowClick={(user) =>
                grid.selectRow(user.id, { rangeOrder: displayUsers.map((item) => item.id) })
              }
              onRowDoubleClick={(user) => handleEditUser(user.id)}
              renderCard={(user) => (
                <UserCard
                  user={user}
                  actions={getUserRowActions(user)}
                />
              )}
            />
          )}
        />
      </GridPanel>

      <ActivityLogsSheet
        open={activityLogUser !== null}
        onOpenChange={(open) => !open && setActivityLogUser(null)}
        subjectType={USER_ACTIVITY_LOG_TYPE}
        subjectId={activityLogUser?.id ?? 0}
        subjectLabel={activityLogUser?.name ?? ''}
      />

      <AlertDialog
        open={grid.deleteIds.length > 0}
        onOpenChange={(open) => !open && grid.clearDeleteRequest()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogPanelTitle icon={Trash2}>
              {grid.deleteIds.length === 1
                ? t('users.delete.title_one')
                : t('users.delete.title_many', { count: grid.deleteIds.length })}
            </AlertDialogPanelTitle>
            <AlertDialogDescription>
              {t('common.confirm_delete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel />
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
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
