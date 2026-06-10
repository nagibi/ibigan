import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
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
import { GridFiltersControl } from '@/components/grid/grid-filters-control';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridTable } from '@/components/grid/grid-table';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export function RolesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useApiToolbarAlert();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('permissao-gerenciar');
  const initialUrlState = useRef(parseGridUrlState(searchParams)).current;
  const grid = useGrid({ defaultSearch: initialUrlState.search });
  const [selected, setSelected] = useState<number[]>([]);
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
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

  const activeFilters = useMemo(() => {
    const items = [];

    if (userFilter) {
      items.push({
        id: 'user',
        label: 'Papéis associados',
        value: userFilter.userName,
        onRemove: clearUserFilter,
      });
    }

    if (grid.search.trim()) {
      items.push({
        id: 'search',
        label: 'Busca',
        value: grid.search.trim(),
        onRemove: grid.clearSearch,
      });
    }

    return items;
  }, [clearUserFilter, grid.clearSearch, grid.search, userFilter]);

  const hasActiveFilters = activeFilters.length > 0;

  const emptyMessage = userFilter
    ? userFilter.roleNames.length === 0
      ? 'Este usuário não possui papéis vinculados.'
      : 'Nenhum papel encontrado para este usuário.'
    : 'Nenhum papel encontrado.';

  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  const clearSelection = useCallback(() => setSelected([]), []);

  const toggleSelectAll = useCallback((ids: number[]) => {
    setSelected((prev) => (prev.length === ids.length ? [] : ids));
  }, []);

  const handleDelete = useCallback(async () => {
    if (deleteIds.length === 0) return;

    try {
      setIsDeleting(true);
      await Promise.all(deleteIds.map((id) => rolesService.destroy(id)));
      await queryClient.invalidateQueries({ queryKey: ['roles'] });
      showSuccess(deleteIds.length === 1 ? 'Papel removido.' : 'Papéis removidos.');
      setDeleteIds([]);
      clearSelection();
    } catch (error) {
      showError('Erro ao remover papéis.', error);
    } finally {
      setIsDeleting(false);
    }
  }, [clearSelection, deleteIds, queryClient, showError, showSuccess]);

  const deletableSelectedIds = useMemo(
    () => selected.filter((id) => {
      const role = roles.find((item) => item.id === id);
      return role && !role.is_system && role.users_count === 0;
    }),
    [roles, selected],
  );

  const columnDefinitions = useMemo<GridColumnDef<Role>[]>(
    () => [
      {
        id: 'select',
        label: '#',
        pinned: 'start',
        hideable: false,
        className: 'w-[40px]',
        render: (role) => (
          <Checkbox
            checked={selected.includes(role.id)}
            onCheckedChange={() => toggleSelect(role.id)}
            onClick={(event) => event.stopPropagation()}
            disabled={role.is_system || role.users_count > 0}
          />
        ),
      },
      {
        id: 'id',
        label: 'Id',
        className: 'w-[70px] text-sm text-muted-foreground',
        render: (role) => role.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'w-[72px]',
        render: (role) => (
          <GridRowActions
            actions={[
              {
                label: 'Editar',
                icon: Pencil,
                onClick: () => navigate(`/roles/${role.id}`),
              },
              ...(canManage && !role.is_system && role.users_count === 0
                ? [{
                    label: 'Remover',
                    icon: Trash2,
                    tone: 'destructive' as const,
                    onClick: () => setDeleteIds([role.id]),
                  }]
                : []),
            ]}
          />
        ),
      },
      {
        id: 'name',
        label: 'Papel',
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
        label: 'Tipo',
        className: 'w-[120px]',
        render: (role) => (
          <Badge variant={role.is_system ? 'outline' : 'secondary'}>
            {role.is_system ? 'Sistema' : 'Personalizado'}
          </Badge>
        ),
      },
      {
        id: 'permissions',
        label: 'Permissões',
        className: 'w-[110px] text-sm text-muted-foreground',
        render: (role) => role.permissions.length,
      },
      {
        id: 'users_count',
        label: 'Usuários',
        className: 'w-[90px] text-sm text-muted-foreground',
        render: (role) => role.users_count,
      },
      {
        id: 'created_at',
        label: 'Criado em',
        className: 'w-[150px] text-sm text-muted-foreground whitespace-nowrap',
        render: (role) => formatDateTime(role.created_at),
      },
    ],
    [canManage, navigate, selected, toggleSelect],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);
  const visibleIds = filteredRoles
    .filter((role) => !role.is_system && role.users_count === 0)
    .map((role) => role.id);
  const allVisibleSelected = visibleIds.length > 0
    && visibleIds.every((id) => selected.includes(id));

  const handleClearFilters = useCallback(() => {
    grid.clearSearch();
    clearUserFilter();
    showSuccess('Filtros removidos.');
  }, [clearUserFilter, grid, showSuccess]);

  const handleResetGrid = useCallback(() => {
    gridColumns.resetColumns();
    grid.resetSettings();
    grid.clearSearch();
    clearUserFilter();
    clearSelection();
    showSuccess('Grid restaurado ao padrão.');
  }, [clearSelection, clearUserFilter, grid, gridColumns, showSuccess]);

  usePageToolbar({
    title: 'Papéis',
    description: 'Gerencie papéis e permissões de acesso da organização.',
    actions: canManage ? (
      <StandardGridToolbar
        onDelete={() => deletableSelectedIds.length > 0 && setDeleteIds([...deletableSelectedIds])}
        hasSelection={deletableSelectedIds.length > 0}
        extra={(
          <Button variant="primary" size="sm" className="h-8" onClick={() => navigate('/roles/new')}>
            <Plus className="mr-1.5 size-3.5" />
            Novo papel
          </Button>
        )}
      />
    ) : undefined,
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={(
          <GridPanelToolbar
            onSelectAll={canManage ? () => toggleSelectAll(visibleIds) : undefined}
            isAllSelected={allVisibleSelected}
            selectedCount={selected.length}
            onClearSelection={clearSelection}
            onRefresh={() => void refetch()}
            isRefreshing={isLoading || isFetching}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder="Buscar papéis..."
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
                onResetDefault={gridColumns.resetColumns}
              />
            )}
            resetControl={(
              <GridResetControl
                disabled={!grid.isCustomized && !gridColumns.isCustomized && !hasActiveFilters}
                onReset={handleResetGrid}
              />
            )}
          />
        )}
      >
        <GridTable
          columns={gridColumns.visibleColumns}
          data={filteredRoles}
          getRowKey={(role) => String(role.id)}
          loading={isLoading}
          emptyMessage={emptyMessage}
          onColumnOrderChange={gridColumns.reorderDraggableColumns}
          isRowSelected={(role) => selected.includes(role.id)}
          onRowClick={(role) => navigate(`/roles/${role.id}`)}
          onRowDoubleClick={(role) => navigate(`/roles/${role.id}`)}
        />
      </GridPanel>

      <AlertDialog open={deleteIds.length > 0} onOpenChange={(open) => !open && setDeleteIds([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remover {deleteIds.length === 1 ? 'papel' : `${deleteIds.length} papéis`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Papéis do sistema ou com usuários vinculados não podem ser removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
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
