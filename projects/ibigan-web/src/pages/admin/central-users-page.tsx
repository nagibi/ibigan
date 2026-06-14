import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Power, PowerOff } from 'lucide-react';
import { GRID_VIEW_ICON } from '@/lib/grid-view-action';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useGridPageActions } from '@/hooks/use-grid-page-actions';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridExport } from '@/hooks/use-grid-export';
import { useGridViewMode } from '@/hooks/use-grid-view-mode';
import { useClientGridInfiniteScroll } from '@/hooks/use-grid-infinite-scroll';
import { VIEW_PREFERENCE_KEYS } from '@/types/view-mode';
import { buildClientGridInfiniteScrollProps } from '@/lib/grid-infinite-scroll';
import {
  centralUsersService,
  type PlatformCentralUser,
} from '@/services/central-users.service';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { PageBody } from '@/components/common/page-body';
import { GridColumnDataView } from '@/components/grid/grid-column-data-view';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridRowActions, type GridRowAction } from '@/components/grid/grid-row-actions';
import { getGridRecordCount } from '@/components/grid/grid-record-count';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridViewModeControl } from '@/components/grid/grid-view-mode-control';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { TOGGLE_ACTIVE_LABELS } from '@/lib/toggle-active-alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

const GRID_COLUMNS_KEY = 'grid-columns:central-users-v3';

function formatCreatedAt(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), "dd/MM/yy 'às' HH:mm", { locale: ptBR });
}

export function CentralUsersPage() {
  const navigate = useNavigate();
  const currentUserId = useCentralAuthStore((state) => state.centralUser?.id);
  const { showSuccess, showError, showToggleActive } = useApiToolbarAlert();
  const [rowToggleId, setRowToggleId] = useState<number | null>(null);
  const [rowActiveId, setRowActiveId] = useState<number | null>(null);
  const loadRef = useRef<() => Promise<void>>(async () => {});

  const { viewMode, setViewMode, infiniteScrollEnabled } = useGridViewMode(VIEW_PREFERENCE_KEYS.centralUsers);

  const grid = useGrid({
    onActivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => centralUsersService.toggleActive(id, true)));
        showToggleActive(true, TOGGLE_ACTIVE_LABELS.user, ids.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao ativar usuário(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
    onDeactivate: async (ids) => {
      const idsToDeactivate = ids.filter((id) => id !== currentUserId);

      if (idsToDeactivate.length === 0) {
        showError('Você não pode desativar seu próprio usuário.');
        throw new Error('toggle-active-failed');
      }

      try {
        await Promise.all(
          idsToDeactivate.map((id) => centralUsersService.toggleActive(id, false)),
        );
        showToggleActive(false, TOGGLE_ACTIVE_LABELS.user, idsToDeactivate.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao inativar usuário(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['central-users'],
    queryFn: () => centralUsersService.list(),
  });

  const users = data?.data.result.data ?? [];

  const filteredUsers = useMemo(() => {
    const query = grid.debouncedSearch.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      user.name.toLowerCase().includes(query)
      || user.email.toLowerCase().includes(query),
    );
  }, [grid.debouncedSearch, users]);

  const clientInfinite = useClientGridInfiniteScroll({
    items: filteredUsers,
    page: grid.page,
    perPage: grid.perPage,
    setPage: grid.setPage,
    enabled: infiniteScrollEnabled,
    resetDeps: [grid.debouncedSearch, filteredUsers.length],
  });

  const displayUsers = infiniteScrollEnabled ? clientInfinite.displayItems : filteredUsers;

  const load = useCallback(async () => {
    await refetch();
  }, [refetch]);

  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleSuperAdmin(user: PlatformCentralUser, nextValue: boolean) {
    if (user.id === currentUserId) {
      showError('Você não pode alterar seu próprio status de super-admin.');
      return;
    }

    if (user.is_super_admin === nextValue) return;

    try {
      setRowToggleId(user.id);
      await centralUsersService.toggleSuperAdmin(user.id);
      showSuccess(
        nextValue
          ? `${user.name} agora é super-admin.`
          : `${user.name} não é mais super-admin.`,
      );
      await loadRef.current();
    } catch (error) {
      showError('Erro ao alterar status de super-admin.', error);
    } finally {
      setRowToggleId(null);
    }
  }

  async function handleToggleActive(user: PlatformCentralUser, nextValue: boolean) {
    if (user.id === currentUserId && !nextValue) {
      showError('Você não pode desativar seu próprio usuário.');
      return;
    }

    if (user.is_active === nextValue) return;

    try {
      setRowActiveId(user.id);
      await centralUsersService.toggleActive(user.id, nextValue);
      showToggleActive(nextValue, TOGGLE_ACTIVE_LABELS.user);
      await loadRef.current();
    } catch (error) {
      showError('Erro ao atualizar status do usuário.', error);
    } finally {
      setRowActiveId(null);
    }
  }

  const handleEditUser = useCallback(
    (userId: number) => navigate(`/admin/super-admins/${userId}/editar`),
    [navigate],
  );

  const handleEditSelected = useCallback(() => {
    if (!grid.singleSelection) return;
    handleEditUser(grid.selected[0]);
  }, [grid.selected, grid.singleSelection, handleEditUser]);

  const getUserRowActions = useCallback(
    (user: PlatformCentralUser): GridRowAction[] => {
      const isSelf = user.id === currentUserId;
      const isToggling = rowActiveId === user.id;

      return [
        {
          label: 'Editar',
          icon: GRID_VIEW_ICON,
          onClick: () => handleEditUser(user.id),
        },
        {
          label: user.is_active ? 'Inativar' : 'Ativar',
          icon: user.is_active ? PowerOff : Power,
          hidden: isSelf && user.is_active,
          disabled: isToggling,
          onClick: () => void handleToggleActive(user, !user.is_active),
        },
      ];
    },
    [currentUserId, handleEditUser, rowActiveId],
  );

  const columnDefinitions = useMemo<GridColumnDef<PlatformCentralUser>[]>(() => [
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
      hideable: false,
      className: 'w-[70px] text-sm text-muted-foreground tabular-nums',
      exportValue: (user) => user.id,
      render: (user) => user.id,
    },
    {
      id: 'actions',
      label: 'Ações',
      hideable: false,
      className: 'min-w-[100px] w-[100px]',
      render: (user) => <GridRowActions actions={getUserRowActions(user)} />,
    },
    {
      id: 'is_active',
      label: 'Ativo',
      className: 'w-[80px]',
      render: (user) => {
        const isSelf = user.id === currentUserId;

        return (
          <Switch
            checked={user.is_active}
            disabled={isSelf || rowActiveId === user.id}
            onCheckedChange={(checked) => void handleToggleActive(user, checked)}
            aria-label={`Ativo: ${user.name}`}
          />
        );
      },
    },
    {
      id: 'name',
      label: 'Nome',
      render: (user) => user.name,
    },
    {
      id: 'email',
      label: 'E-mail',
      render: (user) => user.email,
    },
    {
      id: 'is_super_admin',
      label: 'Super-admin',
      render: (user) => {
        const isSelf = user.id === currentUserId;

        return (
          <Switch
            checked={user.is_super_admin}
            disabled={isSelf || rowToggleId === user.id}
            onCheckedChange={(checked) => void handleToggleSuperAdmin(user, checked)}
            aria-label={`Super-admin: ${user.name}`}
          />
        );
      },
    },
    {
      id: 'created_at',
      label: 'Criado em',
      render: (user) => formatCreatedAt(user.created_at),
    },
  ], [currentUserId, getUserRowActions, grid.selected, grid.toggleSelect, rowActiveId, rowToggleId]);

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const { handleExport, isExporting } = useGridExport({
    filename: 'super-admins',
    columns: gridColumns.visibleColumns,
    rows: displayUsers,
  });

  const gridActions = useGridPageActions({
    resetColumns: gridColumns.resetColumns,
    clearAllFilters: () => {},
    clearSearch: grid.clearSearch,
  });

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onEdit={handleEditSelected}
        onActivate={() => void grid.activateSelected()}
        onDeactivate={() => void grid.deactivateSelected()}
        onExport={handleExport}
        isExporting={isExporting}
        hasSelection={grid.hasSelection && !grid.isTogglingActive}
        singleSelection={grid.singleSelection && !grid.isTogglingActive}
        isTogglingActive={grid.isTogglingActive}
      />
    ),
    [
      grid.activateSelected,
      grid.deactivateSelected,
      grid.hasSelection,
      grid.isTogglingActive,
      grid.singleSelection,
      handleEditSelected,
      handleExport,
      isExporting,
    ],
  );

  usePageToolbar({
    title: 'Super-admins',
    description: 'Usuários com acesso ao painel central da plataforma.',
    actions: toolbarActions,
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={(
          <GridPanelToolbar
            onSelectAll={() => grid.toggleSelectAll(filteredUsers.map((user) => user.id))}
            isAllSelected={grid.isAllSelected(filteredUsers.length)}
            selectedCount={grid.selected.length}
            onClearSelection={grid.clearSelection}
            onRefresh={() => void loadRef.current()}
            isRefreshing={isLoading || isFetching}
            onExport={handleExport}
            isExporting={isExporting}
            search={grid.search}
            onSearch={grid.setSearch}
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
                onResetDefault={gridActions.handleResetColumns}
              />
            )}
            resetControl={(
              <GridResetControl
                disabled={!gridColumns.isCustomized}
                onReset={gridActions.handleResetGrid}
              />
            )}
            viewModeControl={
              <GridViewModeControl viewMode={viewMode} onViewModeChange={setViewMode} />
            }
            recordCount={getGridRecordCount(filteredUsers.length, displayUsers.length, infiniteScrollEnabled)}
          />
        )}
      >
        <GridColumnDataView
          viewMode={viewMode}
          columns={gridColumns.visibleColumns}
          data={filteredUsers}
          cardData={infiniteScrollEnabled ? displayUsers : undefined}
          loading={isLoading}
          getRowKey={(user) => user.id}
          getRowActions={getUserRowActions}
          titleColumnId="name"
          isRowSelected={(user) => grid.selected.includes(user.id)}
          onRowClick={(user, event) =>
            grid.selectRow(user.id, {
              shift: event.shiftKey,
              rangeOrder: displayUsers.map((item) => item.id),
            })
          }
          onRowDoubleClick={(user) => handleEditUser(user.id)}
          emptyMessage="Nenhum usuário central encontrado."
          infiniteScroll={buildClientGridInfiniteScrollProps({
            enabled: infiniteScrollEnabled,
            clientInfinite,
          })}
        />
      </GridPanel>
    </PageBody>
  );
}
