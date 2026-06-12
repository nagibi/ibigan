import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Copy, LoaderCircle, Mail, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
import { invitesService, type Invite } from '@/services/invites.service';
import { formatDateRangeFilterLabel } from '@/components/grid/grid-date-range-filter';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination, type GridPaginationMeta } from '@/components/grid/grid-pagination';
import { GridTable } from '@/components/grid/grid-table';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
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
import { GridBadge } from '@/components/grid/grid-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const GRID_COLUMNS_KEY = 'grid-columns:invites';

const schema = z.object({
  email: z.string().email('E-mail inválido.'),
  role: z.string().min(1, 'Selecione uma função.'),
});

type FormData = z.infer<typeof schema>;

const statusVariant: Record<Invite['status'], 'secondary' | 'success' | 'destructive'> = {
  pending: 'secondary',
  accepted: 'success',
  expired: 'destructive',
};

const statusLabel: Record<Invite['status'], string> = {
  pending: 'Pendente',
  accepted: 'Aceito',
  expired: 'Expirado',
};

const STATUS_FILTER_OPTIONS = [
  { label: 'Pendente', value: 'pending' },
  { label: 'Aceito', value: 'accepted' },
  { label: 'Expirado', value: 'expired' },
];

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

function formatAuditDate(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), 'dd/MM/yy HH:mm', { locale: ptBR });
}

export function InvitesPage() {
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const { showSuccess, showError, showInfo } = useApiToolbarAlert();

  const grid = useGrid();
  const columnFilters = useGridFilters(() => grid.setPage(1));

  const [invites, setInvites] = useState<Invite[]>([]);
  const [meta, setMeta] = useState<GridPaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'viewer' },
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await invitesService.list(
        grid.page,
        grid.resolvePerPage(meta.total),
        grid.debouncedSearch,
        grid.sort,
        grid.sortDir,
        columnFilters.activeFilterParams,
      );
      setInvites(res.data.result.data);
      setMeta(res.data.result.meta);
    } catch (error) {
      showError('Erro ao carregar convites.', error);
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

  const pendingSelectedIds = useMemo(
    () =>
      grid.selected.filter((id) => {
        const invite = invites.find((item) => item.id === id);
        return invite?.status === 'pending';
      }),
    [grid.selected, invites],
  );

  const hasPendingSelection = pendingSelectedIds.length > 0;

  const handleDeleteSelected = useCallback(() => {
    if (!hasPendingSelection) return;
    grid.requestDelete(pendingSelectedIds);
  }, [grid.requestDelete, hasPendingSelection, pendingSelectedIds]);

  const handleEscape = useCallback(() => {
    if (createOpen) {
      setCreateOpen(false);
      return;
    }
    if (grid.deleteIds.length > 0) {
      grid.clearDeleteRequest();
    }
    if (grid.hasSelection) {
      grid.clearSelection();
    }
  }, [
    createOpen,
    grid.clearDeleteRequest,
    grid.clearSelection,
    grid.deleteIds.length,
    grid.hasSelection,
  ]);

  useGridKeyboard({
    canEdit: false,
    canDelete: hasPendingSelection,
    onDelete: handleDeleteSelected,
    onEscape: handleEscape,
  });

  async function handleDelete() {
    if (grid.deleteIds.length === 0) return;

    try {
      setIsDeleting(true);
      await Promise.all(grid.deleteIds.map((id) => invitesService.destroy(id)));
      showSuccess(
        grid.deleteIds.length === 1
          ? 'Convite cancelado.'
          : `${grid.deleteIds.length} convites cancelados.`,
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
      void load();
    } catch (error) {
      showError('Erro ao cancelar convite(s).', error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleStore(data: FormData) {
    try {
      setIsStoring(true);
      await invitesService.store(data);
      showSuccess('Convite enviado com sucesso!');
      form.reset();
      setCreateOpen(false);
      void load();
    } catch (error) {
      showError('Erro ao enviar convite.', error);
    } finally {
      setIsStoring(false);
    }
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/auth/invite?token=${token}`;
    navigator.clipboard.writeText(url);
    showSuccess('Link copiado!');
  }

  function handleExport() {
    showInfo('Exportação em breve.');
  }

  const columnDefinitions = useMemo<GridColumnDef<Invite>[]>(
    () => [
      {
        id: 'select',
        label: '#',
        pinned: 'start',
        hideable: false,
        className: 'w-[40px]',
        render: (invite) => (
          <Checkbox
            checked={grid.selected.includes(invite.id)}
            onCheckedChange={() => grid.toggleSelect(invite.id)}
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
        render: (invite) => invite.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'w-[72px]',
        render: (invite) => (
          <GridRowActions
            actions={[
              {
                label: 'Copiar link',
                icon: Copy,
                hidden: invite.status !== 'pending' || !invite.token,
                onClick: () => copyInviteLink(invite.token!),
              },
              {
                label: 'Excluir',
                icon: Trash2,
                hidden: invite.status !== 'pending',
                tone: 'destructive',
                onClick: () => grid.requestDelete([invite.id]),
              },
            ]}
          />
        ),
      },
      {
        id: 'email',
        label: 'E-mail',
        sortable: true,
        sortKey: 'email',
        filter: { type: 'text', filterKey: 'email', placeholder: 'E-mail' },
        className: 'min-w-[220px]',
        render: (invite) => <span className="font-medium">{invite.email}</span>,
      },
      {
        id: 'role',
        label: 'Função',
        sortable: true,
        sortKey: 'role',
        filter: { type: 'text', filterKey: 'role', placeholder: 'Função' },
        className: 'min-w-[120px]',
        render: (invite) => (
          <GridBadge variant="outline" className="text-xs">
            {invite.role}
          </GridBadge>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        sortable: true,
        sortKey: 'status',
        filter: {
          type: 'select',
          filterKey: 'status',
          placeholder: 'Todos',
          options: STATUS_FILTER_OPTIONS,
        },
        className: 'min-w-[120px]',
        render: (invite) => (
          <GridBadge variant={statusVariant[invite.status]}>
            {statusLabel[invite.status]}
          </GridBadge>
        ),
      },
      {
        id: 'expires_at',
        label: 'Expira em',
        sortable: true,
        sortKey: 'expires_at',
        filter: { type: 'dateRange', filterKey: 'expires_at' },
        className: 'min-w-[180px] text-sm text-muted-foreground whitespace-nowrap',
        render: (invite) => formatDateTime(invite.expires_at),
      },
      {
        id: 'created_at',
        label: 'Data criação',
        sortable: true,
        sortKey: 'created_at',
        filter: { type: 'dateRange', filterKey: 'created_at' },
        className: 'min-w-[150px] text-sm text-muted-foreground whitespace-nowrap',
        render: (invite) => formatAuditDate(invite.created_at),
      },
    ],
    [grid.requestDelete, grid.selected, grid.toggleSelect],
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
    showSuccess('Colunas restauradas ao padrão.');
  }

  function handleClearFilters() {
    grid.clearSearch();
    columnFilters.clearAllFilters();
    showSuccess('Filtros removidos.');
  }

  function handleResetGrid() {
    gridColumns.resetColumns();
    grid.clearSearch();
    columnFilters.clearAllFilters();
    grid.resetSettings();
    showSuccess('Grid restaurado ao padrão.');
  }

  const hasActiveFilters = grid.hasFilters || columnFilters.hasFilters;
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onNew={() => setCreateOpen(true)}
        onDelete={handleDeleteSelected}
        hasSelection={hasPendingSelection}
      />
    ),
    [handleDeleteSelected, hasPendingSelection],
  );

  usePageToolbar({
    title: 'Convites',
    description: 'Gerencie os convites da organização.',
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
            onSelectAll={() => grid.toggleSelectAll(invites.map((invite) => invite.id))}
            isAllSelected={grid.isAllSelected(invites.length)}
            selectedCount={grid.selected.length}
            onClearSelection={grid.clearSelection}
            onRefresh={load}
            isRefreshing={loading}
            onExport={handleExport}
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
            recordCount={{ total: meta.total }}
          />
        }
        footer={pagination}
      >
        <GridTable
          columns={gridColumns.visibleColumns}
          data={invites}
          getRowKey={(invite) => invite.id}
          loading={loading}
          emptyMessage="Nenhum convite encontrado."
          sort={grid.sort}
          sortDir={grid.sortDir}
          onSort={grid.toggleSort}
          onColumnOrderChange={gridColumns.reorderDraggableColumns}
          columnFilters={columnFilters.filters}
          onColumnFilterChange={columnFilters.setFilter}
          onDateRangeFilterChange={columnFilters.setDateRangeFilter}
          onColumnFilterClear={columnFilters.clearColumnFilter}
          isRowSelected={(invite) => grid.selected.includes(invite.id)}
          onRowClick={(invite, event) =>
            grid.selectRow(invite.id, {
              shift: event.shiftKey,
              rangeOrder: invites.map((item) => item.id),
            })
          }
        />
      </GridPanel>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar convite</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => void handleStore(data))}
              className="space-y-4 pt-2"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="convidado@email.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={isStoring}>
                  {isStoring ? (
                    <>
                      <LoaderCircle className="size-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Mail className="size-4 mr-2" />
                      Enviar convite
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={grid.deleteIds.length > 0}
        onOpenChange={(open) => !open && grid.clearDeleteRequest()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {grid.deleteIds.length === 1
                ? 'Cancelar convite'
                : `Cancelar ${grid.deleteIds.length} convites`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar{' '}
              {grid.deleteIds.length === 1 ? 'este convite' : 'estes convites'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              Cancelar convite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageBody>
  );
}
