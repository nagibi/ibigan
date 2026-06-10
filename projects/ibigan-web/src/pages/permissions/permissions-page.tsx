import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
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
import { GridPanel } from '@/components/grid/grid-panel';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridTable } from '@/components/grid/grid-table';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { GridBadge } from '@/components/grid/grid-badge';
import { Button } from '@/components/ui/button';
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
  const [deleteIds, setDeleteIds] = useState<number[]>([]);
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

  const handleDelete = useCallback(async () => {
    if (deleteIds.length === 0) return;

    try {
      setIsDeleting(true);
      await Promise.all(deleteIds.map((id) => permissionsService.destroy(id)));
      await queryClient.invalidateQueries({ queryKey: ['permissions'] });
      showSuccess(deleteIds.length === 1 ? 'Permissão removida.' : 'Permissões removidas.');
      setDeleteIds([]);
    } catch (error) {
      showError('Erro ao remover permissões.', error);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteIds, queryClient, showError, showSuccess]);

  const columnDefinitions = useMemo<GridColumnDef<Permission>[]>(
    () => [
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
                onClick: () => navigate(`/permissions/${permission.id}`),
              },
              ...(canManage
                ? [{
                    label: 'Remover',
                    icon: Trash2,
                    tone: 'destructive' as const,
                    onClick: () => setDeleteIds([permission.id]),
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
    [canManage, navigate],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const handleResetGrid = useCallback(() => {
    gridColumns.resetColumns();
    grid.resetSettings();
    showSuccess('Grid restaurado ao padrão.');
  }, [grid, gridColumns, showSuccess]);

  usePageToolbar({
    title: 'Permissões',
    description: 'Catálogo de permissões disponíveis para os papéis da organização.',
    actions: canManage ? (
      <StandardGridToolbar
        hasSelection={false}
        extra={(
          <Button variant="primary" size="sm" className="h-8" onClick={() => navigate('/permissions/new')}>
            <Plus className="mr-1.5 size-3.5" />
            Nova permissão
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
            onRefresh={() => void refetch()}
            isRefreshing={isLoading || isFetching}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder="Buscar permissões..."
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
                disabled={!grid.isCustomized && !gridColumns.isCustomized}
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
          onRowClick={(permission) => navigate(`/permissions/${permission.id}`)}
          onRowDoubleClick={(permission) => navigate(`/permissions/${permission.id}`)}
        />
      </GridPanel>

      <AlertDialog open={deleteIds.length > 0} onOpenChange={(open) => !open && setDeleteIds([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remover {deleteIds.length === 1 ? 'permissão' : `${deleteIds.length} permissões`}
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
