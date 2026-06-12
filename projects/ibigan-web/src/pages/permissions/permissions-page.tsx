import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import {
  formatPermissionAction,
  formatPermissionName,
  formatPermissionResource,
} from '@/lib/role-permission-labels';
import { permissionsService, type Permission } from '@/services/permissions.service';
import { useAuthStore } from '@/stores/auth.store';
import { PageBody } from '@/components/common/page-body';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridFiltersControl } from '@/components/grid/grid-filters-control';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridTable } from '@/components/grid/grid-table';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
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

const GRID_COLUMNS_KEY = 'grid-columns:permissions';

export function PermissionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useApiToolbarAlert();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('permissao-gerenciar');
  const grid = useGrid();
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
        grid.deleteIds.length === 1 ? 'Permissão removida.' : 'Permissões removidas.',
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
    } catch (error) {
      showError('Erro ao remover permissões.', error);
    } finally {
      setIsDeleting(false);
    }
  }, [grid, queryClient, showError, showSuccess]);

  const handleEditPermission = useCallback(
    (permissionId: number) => navigate(`/permissions/${permissionId}`),
    [navigate],
  );

  const columnDefinitions = useMemo<GridColumnDef<Permission>[]>(
    () => [
      ...(canManage
        ? [{
            id: 'select',
            label: '#',
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
        label: 'Id',
        className: 'w-[70px] text-sm text-muted-foreground',
        render: (permission) => permission.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'w-[72px]',
        render: (permission) => (
          <GridRowActions
            actions={[
              {
                label: 'Editar',
                icon: Pencil,
                onClick: () => handleEditPermission(permission.id),
              },
              ...(canManage
                ? [{
                    label: 'Remover',
                    icon: Trash2,
                    tone: 'destructive' as const,
                    onClick: () => grid.requestDelete([permission.id]),
                  }]
                : []),
            ]}
          />
        ),
      },
      {
        id: 'name',
        label: 'Permissão',
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
        label: 'Recurso',
        className: 'w-[140px]',
        render: (permission) => (
          <GridBadge variant="outline">{formatPermissionResource(permission.resource)}</GridBadge>
        ),
      },
      {
        id: 'action',
        label: 'Ação',
        className: 'w-[120px]',
        render: (permission) => (
          <GridBadge variant="secondary">{formatPermissionAction(permission.action)}</GridBadge>
        ),
      },
    ],
    [canManage, grid.requestDelete, grid.selected, grid.toggleSelect, handleEditPermission],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const activeFilters = useMemo(() => {
    if (!grid.search.trim()) return [];

    return [{
      id: 'search',
      label: 'Busca',
      value: grid.search.trim(),
      onRemove: grid.clearSearch,
    }];
  }, [grid.clearSearch, grid.search]);

  const hasActiveFilters = activeFilters.length > 0;
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  function handleClearFilters() {
    grid.clearSearch();
    toast.success('Filtros removidos.');
  }

  function handleResetGrid() {
    gridColumns.resetColumns();
    grid.resetSettings();
    grid.clearSearch();
    grid.clearSelection();
    toast.success('Grid restaurado ao padrão.');
  }

  function handleExport() {
    toast.info('Exportação em breve.');
  }

  const toolbarActions = useMemo(
    () => (canManage ? (
      <StandardGridToolbar
        onNew={() => navigate('/permissions/new')}
        onEdit={handleEditSelected}
        onDelete={handleDeleteSelected}
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
      navigate,
    ],
  );

  usePageToolbar({
    title: 'Permissões',
    description: 'Catálogo de permissões disponíveis para os papéis da organização.',
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
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder="Buscar permissões..."
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
                onResetDefault={() => {
                  gridColumns.resetColumns();
                  toast.success('Colunas restauradas ao padrão.');
                }}
              />
            )}
            resetControl={(
              <GridResetControl
                disabled={!isGridCustomized}
                onReset={handleResetGrid}
              />
            )}
          />
        )}
      >
        <GridTable
          columns={gridColumns.visibleColumns}
          data={filteredPermissions}
          getRowKey={(permission) => String(permission.id)}
          loading={isLoading}
          emptyMessage="Nenhuma permissão encontrada."
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
      </GridPanel>

      <AlertDialog open={grid.deleteIds.length > 0} onOpenChange={grid.clearDeleteRequest}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remover {grid.deleteIds.length === 1 ? 'permissão' : `${grid.deleteIds.length} permissões`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Permissões vinculadas a papéis não podem ser removidas.
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
