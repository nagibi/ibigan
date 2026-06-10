import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
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
import { ActivityLogsSheet } from '@/components/activity-logs/activity-logs-sheet';
import { TOGGLE_ACTIVE_LABELS } from '@/lib/toggle-active-alert';
import { formatCpf, formatPhone } from '@/lib/brazilian-masks';
import { formatUserGender, USER_GENDER_OPTIONS } from '@/lib/user-gender';
import { isUserActive, usersService, type User } from '@/services/users.service';
import { formatDateRangeFilterLabel } from '@/components/grid/grid-date-range-filter';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridFiltersControl } from '@/components/grid/grid-filters-control';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination, type GridPaginationMeta } from '@/components/grid/grid-pagination';
import { GridTable } from '@/components/grid/grid-table';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { getInitials } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';

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

const GENDER_FILTER_OPTIONS = USER_GENDER_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value,
}));

function getAuditUserName(
  user: User,
  field: 'created_by' | 'updated_by',
) {
  const ref = user[field];
  if (ref?.name) return ref.name;

  const flatName = field === 'created_by' ? user.created_by_name : user.updated_by_name;
  return flatName ?? '—';
}

const STATUS_FILTER_OPTIONS = [
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
];

export function UsersPage() {
  const navigate = useNavigate();
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const { showToggleActive, showError, showSuccess } = useApiToolbarAlert();

  const grid = useGrid({
    onActivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => usersService.toggleActive(id, true)));
        showToggleActive(true, TOGGLE_ACTIVE_LABELS.user, ids.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao ativar usuário(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
    onDeactivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => usersService.toggleActive(id, false)));
        showToggleActive(false, TOGGLE_ACTIVE_LABELS.user, ids.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao inativar usuário(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
  });

  const columnFilters = useGridFilters(() => grid.setPage(1));

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

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await usersService.list(
        grid.page,
        grid.perPage,
        grid.debouncedSearch,
        grid.sort,
        grid.sortDir,
        columnFilters.activeFilterParams,
      );
      setUsers(res.data.result.data);
      setMeta(res.data.result.meta);
    } catch (error) {
      showError('Erro ao carregar usuários.', error);
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
          ? 'Usuário removido.'
          : `${grid.deleteIds.length} usuários removidos.`,
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
      void load();
    } catch (error) {
      showError('Erro ao remover usuário(s).', error);
    } finally {
      setIsDeleting(false);
    }
  }

  const handleEditUser = useCallback(
    (userId: number) => navigate(`/users/${userId}`),
    [navigate],
  );

  function handleExport() {
    toast.info('Exportação em breve.');
  }

  async function handleRowStatusChange(user: User, active: boolean) {
    const currentlyActive = isUserActive(user);
    if (currentlyActive === active) return;

    try {
      setRowStatusId(user.id);
      await usersService.toggleActive(user.id, active);
      showToggleActive(active, TOGGLE_ACTIVE_LABELS.user);
      void load();
    } catch (error) {
      showError('Erro ao atualizar status do usuário.', error);
    } finally {
      setRowStatusId(null);
    }
  }

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onNew={() => navigate('/users/new')}
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

  const columnDefinitions = useMemo<GridColumnDef<User>[]>(
    () => [
      {
        id: 'select',
        label: '#',
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
        label: 'Id',
        sortable: true,
        sortKey: 'id',
        filter: { type: 'multi', filterKey: 'id', placeholder: 'ID', inputMode: 'numeric' },
        className: 'w-[70px] text-sm text-muted-foreground',
        render: (user) => user.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'w-[72px]',
        render: (user) => (
          <GridRowActions
            actions={[
              {
                label: 'Editar',
                icon: Pencil,
                onClick: () => navigate(`/users/${user.id}`),
              },
              {
                label: 'Activity Logs',
                icon: Activity,
                onClick: () => setActivityLogUser(user),
              },
            ]}
          />
        ),
      },
      {
        id: 'active',
        label: 'Ativo',
        sortable: true,
        sortKey: 'status',
        filter: {
          type: 'select',
          filterKey: 'status',
          placeholder: 'Todos',
          options: STATUS_FILTER_OPTIONS,
        },
        className: 'w-[80px]',
        render: (user) => (
          <Switch
            size="sm"
            checked={isUserActive(user)}
            disabled={rowStatusId === user.id}
            onCheckedChange={(checked) => void handleRowStatusChange(user, checked)}
          />
        ),
      },
      {
        id: 'user',
        label: 'Usuário',
        sortable: true,
        sortKey: 'name',
        filter: { type: 'multi', filterKey: 'user', placeholder: 'Nome ou e-mail' },
        className: 'min-w-[220px]',
        render: (user) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {getInitials(user.name, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-max">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        ),
      },
      {
        id: 'roles',
        label: 'Papel',
        filter: { type: 'text', filterKey: 'role', placeholder: 'Papel' },
        className: 'min-w-[120px]',
        render: (user) => (
          <div className="flex gap-1">
            {user.roles.map((role) => (
              <Badge key={role} variant="outline" className="text-xs">
                {role}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        id: 'cpf',
        label: 'CPF',
        sortable: true,
        sortKey: 'cpf',
        filter: { type: 'text', filterKey: 'cpf', placeholder: 'CPF' },
        className: 'min-w-[130px] text-sm whitespace-nowrap',
        render: (user) => formatCpf(user.cpf) || '—',
      },
      {
        id: 'phone',
        label: 'Telefone',
        sortable: true,
        sortKey: 'phone',
        filter: { type: 'text', filterKey: 'phone', placeholder: 'Telefone' },
        className: 'min-w-[130px] text-sm whitespace-nowrap',
        render: (user) => formatPhone(user.phone) || '—',
      },
      {
        id: 'birth_date',
        label: 'Nascimento',
        sortable: true,
        sortKey: 'birth_date',
        filter: { type: 'dateRange', filterKey: 'birth_date' },
        className: 'min-w-[120px] text-sm text-muted-foreground whitespace-nowrap',
        render: (user) => formatBirthDate(user.birth_date),
      },
      {
        id: 'gender',
        label: 'Gênero',
        sortable: true,
        sortKey: 'gender',
        filter: {
          type: 'select',
          filterKey: 'gender',
          placeholder: 'Todos',
          options: GENDER_FILTER_OPTIONS,
        },
        className: 'min-w-[150px] text-sm',
        render: (user) => formatUserGender(user.gender),
      },
      {
        id: 'bio',
        label: 'Bio',
        filter: { type: 'text', filterKey: 'bio', placeholder: 'Bio' },
        className: 'min-w-[180px] text-sm text-muted-foreground',
        render: (user) => truncateText(user.bio),
      },
      {
        id: 'last_login_at',
        label: 'Último login',
        sortable: true,
        sortKey: 'last_login_at',
        filter: { type: 'dateRange', filterKey: 'last_login_at' },
        className: 'min-w-[150px] text-sm text-muted-foreground whitespace-nowrap',
        render: (user) => formatAuditDate(user.last_login_at),
      },
      {
        id: 'last_login_ip',
        label: 'IP último login',
        filter: { type: 'text', filterKey: 'last_login_ip', placeholder: 'IP' },
        className: 'min-w-[130px] text-sm text-muted-foreground font-mono text-xs',
        render: (user) => user.last_login_ip ?? '—',
      },
      {
        id: 'last_login_device',
        label: 'Dispositivo',
        filter: { type: 'text', filterKey: 'last_login_device', placeholder: 'Dispositivo' },
        className: 'min-w-[180px] text-sm text-muted-foreground',
        render: (user) => truncateText(user.last_login_device, 40),
      },
      {
        id: 'created_at',
        label: 'Data criação',
        sortable: true,
        sortKey: 'created_at',
        filter: { type: 'dateRange', filterKey: 'created_at' },
        className: 'min-w-[150px] text-sm text-muted-foreground whitespace-nowrap',
        render: (user) => formatAuditDate(user.created_at),
      },
      {
        id: 'created_by',
        label: 'Usuário criação',
        filter: { type: 'text', filterKey: 'created_by', placeholder: 'Usuário' },
        className: 'min-w-[160px] text-sm text-muted-foreground',
        render: (user) => getAuditUserName(user, 'created_by'),
      },
      {
        id: 'updated_at',
        label: 'Data atualização',
        sortable: true,
        sortKey: 'updated_at',
        filter: { type: 'dateRange', filterKey: 'updated_at' },
        className: 'min-w-[160px] text-sm text-muted-foreground whitespace-nowrap',
        render: (user) => formatAuditDate(user.updated_at),
      },
      {
        id: 'updated_by',
        label: 'Usuário atualização',
        filter: { type: 'text', filterKey: 'updated_by', placeholder: 'Usuário' },
        className: 'min-w-[170px] text-sm text-muted-foreground',
        render: (user) => getAuditUserName(user, 'updated_by'),
      },
    ],
    [
      grid.selected,
      grid.toggleSelect,
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

  usePageToolbar({
    title: 'Usuários',
    description: 'Gerencie os usuários da organização.',
    actions: toolbarActions,
  });

  const pagination = (
    <GridPagination
      meta={meta}
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
            search={grid.search}
            onSearch={grid.setSearch}
            filtersControl={
              <GridFiltersControl
                filters={activeFilters}
                onClearAll={hasActiveFilters ? handleClearFilters : undefined}
              />
            }
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
          />
        }
        footer={pagination}
      >
        <GridTable
          columns={gridColumns.visibleColumns}
          data={users}
          getRowKey={(user) => user.id}
          loading={loading}
          emptyMessage="Nenhum usuário encontrado."
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
              rangeOrder: users.map((item) => item.id),
            })
          }
          onRowDoubleClick={(user) => handleEditUser(user.id)}
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
            <AlertDialogTitle>
              {grid.deleteIds.length === 1 ? 'Remover usuário' : `Remover ${grid.deleteIds.length} usuários`}
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
