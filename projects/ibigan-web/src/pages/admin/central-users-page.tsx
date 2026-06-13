import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useGridPageActions } from '@/hooks/use-grid-page-actions';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
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
import { getGridRecordCount } from '@/components/grid/grid-record-count';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridViewModeControl } from '@/components/grid/grid-view-mode-control';
import { GridPanelToolbar } from '@/components/grid/grid-toolbar';
import { GridBadge } from '@/components/grid/grid-badge';
import { Switch } from '@/components/ui/switch';

const GRID_COLUMNS_KEY = 'grid-columns:central-users';

function formatCreatedAt(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), "dd/MM/yy 'às' HH:mm", { locale: ptBR });
}

export function CentralUsersPage() {
  const currentUserId = useCentralAuthStore((state) => state.centralUser?.id);
  const { showSuccess, showError } = useApiToolbarAlert();
  const [rowToggleId, setRowToggleId] = useState<number | null>(null);
  const loadRef = useRef<() => Promise<void>>(async () => {});

  const { viewMode, setViewMode, infiniteScrollEnabled } = useGridViewMode(VIEW_PREFERENCE_KEYS.centralUsers);
  const grid = useGrid();

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

  const columnDefinitions = useMemo<GridColumnDef<PlatformCentralUser>[]>(() => [
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
      id: 'is_active',
      label: 'Ativo',
      render: (user) => (
        <GridBadge variant={user.is_active ? 'success' : 'destructive'}>
          {user.is_active ? 'Ativo' : 'Inativo'}
        </GridBadge>
      ),
    },
    {
      id: 'created_at',
      label: 'Criado em',
      render: (user) => formatCreatedAt(user.created_at),
    },
  ], [currentUserId, rowToggleId]);

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const gridActions = useGridPageActions({
    resetColumns: gridColumns.resetColumns,
    clearAllFilters: () => {},
    clearSearch: grid.clearSearch,
  });

  usePageToolbar({
    title: 'Super-admins',
    description: 'Usuários com acesso ao painel central da plataforma.',
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={(
          <GridPanelToolbar
            onRefresh={() => void loadRef.current()}
            isRefreshing={isLoading || isFetching}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder="Buscar por nome ou e-mail..."
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
