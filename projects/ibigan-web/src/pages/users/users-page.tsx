import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, MoreHorizontal, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { usersService, type User } from '@/services/users.service';
import { formatDateRangeFilterLabel } from '@/components/grid/grid-date-range-filter';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridFiltersControl } from '@/components/grid/grid-filters-control';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination, type GridPaginationMeta } from '@/components/grid/grid-pagination';
import { GridTable } from '@/components/grid/grid-table';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { getInitials } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const grid = useGrid({
    onActivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => usersService.toggleActive(id, true)));
        toast.success(ids.length === 1 ? 'Usuário ativado.' : 'Usuários ativados.');
        await loadRef.current();
      } catch {
        toast.error('Erro ao ativar usuário(s).');
        throw new Error('toggle-active-failed');
      }
    },
    onDeactivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => usersService.toggleActive(id, false)));
        toast.success(ids.length === 1 ? 'Usuário inativado.' : 'Usuários inativados.');
        await loadRef.current();
      } catch {
        toast.error('Erro ao inativar usuário(s).');
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
    } catch {
      toast.error('Erro ao carregar usuários.');
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
  ]);

  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  const handleEditSelected = useCallback(() => {
    if (!grid.singleSelection) return;
    navigate(`/users/${grid.selected[0]}/editar`);
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
      toast.success(
        grid.deleteIds.length === 1
          ? 'Usuário removido.'
          : `${grid.deleteIds.length} usuários removidos.`,
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
      void load();
    } catch {
      toast.error('Erro ao remover usuário(s).');
    } finally {
      setIsDeleting(false);
    }
  }

  const handleEditUser = useCallback(
    (userId: number) => navigate(`/users/${userId}/editar`),
    [navigate],
  );

  function handleExport() {
    toast.info('Exportação em breve.');
  }

  async function handleRowStatusChange(user: User, active: boolean) {
    const isActive = user.status === 'active';
    if (isActive === active) return;

    try {
      setRowStatusId(user.id);
      await usersService.toggleActive(user.id, active);
      toast.success(active ? 'Usuário ativado.' : 'Usuário inativado.');
      void load();
    } catch {
      toast.error('Erro ao atualizar status do usuário.');
    } finally {
      setRowStatusId(null);
    }
  }

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onNew={() => navigate('/users/novo')}
        newLabel="Novo Usuário"
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
        label: '',
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
        label: 'ID',
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
        className: 'w-[60px]',
        render: (user) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" mode="icon" size="sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={() => navigate(`/users/${user.id}/editar`)}>
                <Pencil className="size-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActivityLogUser(user)}>
                <Activity className="size-4" />
                Activity Logs
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
      {
        id: 'user',
        label: 'Usuário',
        sortable: true,
        sortKey: 'name',
        filter: { type: 'multi', filterKey: 'user', placeholder: 'Nome ou e-mail' },
        render: (user) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {getInitials(user.name, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
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
            checked={user.status === 'active'}
            disabled={rowStatusId === user.id}
            onCheckedChange={(checked) => void handleRowStatusChange(user, checked)}
          />
        ),
      },
      {
        id: 'created_at',
        label: 'Data criação',
        sortable: true,
        sortKey: 'created_at',
        filter: { type: 'dateRange', filterKey: 'created_at' },
        className: 'text-sm text-muted-foreground whitespace-nowrap',
        render: (user) => formatAuditDate(user.created_at),
      },
      {
        id: 'created_by',
        label: 'Usuário criação',
        filter: { type: 'text', filterKey: 'created_by', placeholder: 'Usuário' },
        className: 'text-sm text-muted-foreground',
        render: (user) => getAuditUserName(user, 'created_by'),
      },
      {
        id: 'updated_at',
        label: 'Data atualização',
        sortable: true,
        sortKey: 'updated_at',
        filter: { type: 'dateRange', filterKey: 'updated_at' },
        className: 'text-sm text-muted-foreground whitespace-nowrap',
        render: (user) => formatAuditDate(user.updated_at),
      },
      {
        id: 'updated_by',
        label: 'Usuário atualização',
        filter: { type: 'text', filterKey: 'updated_by', placeholder: 'Usuário' },
        className: 'text-sm text-muted-foreground',
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
    <div className="container pb-6">
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
                isCustomized={gridColumns.isCustomized}
                onOrderChange={gridColumns.setColumnOrder}
                onToggleVisibility={gridColumns.toggleColumnVisibility}
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
          getRowClassName={(user) =>
            grid.selected.includes(user.id) ? 'bg-muted/50' : ''
          }
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
    </div>
  );
}
