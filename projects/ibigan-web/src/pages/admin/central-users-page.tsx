import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import {
  centralUsersService,
  type PlatformCentralUser,
} from '@/services/central-users.service';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { PageBody } from '@/components/common/page-body';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridTable } from '@/components/grid/grid-table';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
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

  const columns = useGridColumns<PlatformCentralUser>({
    storageKey: GRID_COLUMNS_KEY,
    definitions: useMemo<GridColumnDef<PlatformCentralUser>[]>(() => [
      {
        id: 'name',
        header: 'Nome',
        accessorKey: 'name',
        cell: ({ row }) => row.original.name,
        enableSorting: false,
      },
      {
        id: 'email',
        header: 'E-mail',
        accessorKey: 'email',
        cell: ({ row }) => row.original.email,
        enableSorting: false,
      },
      {
        id: 'is_super_admin',
        header: 'Super-admin',
        accessorKey: 'is_super_admin',
        cell: ({ row }) => {
          const user = row.original;
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
        enableSorting: false,
      },
      {
        id: 'is_active',
        header: 'Ativo',
        accessorKey: 'is_active',
        cell: ({ row }) => (
          <GridBadge variant={row.original.is_active ? 'success' : 'secondary'}>
            {row.original.is_active ? 'Ativo' : 'Inativo'}
          </GridBadge>
        ),
        enableSorting: false,
      },
      {
        id: 'created_at',
        header: 'Criado em',
        accessorKey: 'created_at',
        cell: ({ row }) => formatCreatedAt(row.original.created_at),
        enableSorting: false,
      },
    ], [currentUserId, rowToggleId]),
  });

  usePageToolbar({
    title: 'Super-admins',
    description: 'Usuários com acesso ao painel central da plataforma.',
  });

  return (
    <PageBody>
      <GridPanel>
        <GridPanelToolbar>
          <StandardGridToolbar
            search={grid.search}
            onSearchChange={grid.setSearch}
            loading={isLoading || isFetching}
            onRefresh={() => void loadRef.current()}
            leftSlot={<GridColumnsControl columns={columns} />}
            rightSlot={<GridResetControl onReset={columns.resetColumns} />}
          />
        </GridPanelToolbar>

        <GridTable
          columns={columns.visibleColumns}
          data={filteredUsers}
          loading={isLoading}
          emptyMessage="Nenhum usuário central encontrado."
        />
      </GridPanel>
    </PageBody>
  );
}
