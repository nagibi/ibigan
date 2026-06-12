import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridFilters } from '@/hooks/use-grid-filters';
import {
  userApprovalsService,
  type UserApproval,
} from '@/services/user-approvals.service';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination, type GridPaginationMeta } from '@/components/grid/grid-pagination';
import { GridTable } from '@/components/grid/grid-table';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridPanelToolbar } from '@/components/grid/grid-toolbar';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const GRID_COLUMNS_KEY = 'grid-columns:user-approvals';

const STATUS_FILTER_OPTIONS = [
  { label: 'Pendente', value: 'pending' },
  { label: 'Aprovado', value: 'approved' },
  { label: 'Rejeitado', value: 'rejected' },
];

const statusVariant: Record<UserApproval['status'], 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

const statusLabel: Record<UserApproval['status'], string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), "dd/MM/yy 'às' HH:mm", { locale: ptBR });
}

export function UserApprovalsPage() {
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const { showSuccess, showError } = useApiToolbarAlert();

  const grid = useGrid();
  const columnFilters = useGridFilters(() => grid.setPage(1));

  const [approvals, setApprovals] = useState<UserApproval[]>([]);
  const [meta, setMeta] = useState<GridPaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<UserApproval | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveTarget, setApproveTarget] = useState<UserApproval | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userApprovalsService.list(
        grid.page,
        grid.resolvePerPage(meta.total),
        columnFilters.activeFilterParams,
      );
      setApprovals(res.data.result.data);
      setMeta(res.data.result.meta);
    } catch (error) {
      showError('Erro ao carregar aprovações.', error);
    } finally {
      setLoading(false);
    }
  }, [
    grid.page,
    grid.perPage,
    columnFilters.activeFilterParams,
    showError,
  ]);

  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  const handleEscape = useCallback(() => {
    if (approveTarget) {
      setApproveTarget(null);
      return;
    }
    if (rejectTarget) {
      setRejectTarget(null);
      setRejectReason('');
    }
  }, [approveTarget, rejectTarget]);

  useGridKeyboard({
    canEdit: false,
    canDelete: false,
    onEscape: handleEscape,
  });

  async function handleApprove() {
    if (!approveTarget) return;

    try {
      setProcessing(true);
      await userApprovalsService.approve(approveTarget.id);
      showSuccess(`${approveTarget.user_name} aprovado com sucesso!`);
      setApproveTarget(null);
      void load();
    } catch (error) {
      showError('Erro ao aprovar usuário.', error);
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;

    try {
      setProcessing(true);
      await userApprovalsService.reject(rejectTarget.id, rejectReason || undefined);
      showSuccess(`${rejectTarget.user_name} rejeitado.`);
      setRejectTarget(null);
      setRejectReason('');
      void load();
    } catch (error) {
      showError('Erro ao rejeitar usuário.', error);
    } finally {
      setProcessing(false);
    }
  }

  const columnDefinitions = useMemo<GridColumnDef<UserApproval>[]>(
    () => [
      {
        id: 'id',
        label: 'Id',
        className: 'w-[70px] text-sm text-muted-foreground',
        render: (approval) => approval.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'w-[72px]',
        render: (approval) => (
          <GridRowActions
            actions={[
              {
                label: 'Aprovar',
                icon: CheckCircle,
                hidden: approval.status !== 'pending',
                tone: 'success',
                onClick: () => setApproveTarget(approval),
              },
              {
                label: 'Rejeitar',
                icon: XCircle,
                hidden: approval.status !== 'pending',
                tone: 'destructive',
                onClick: () => {
                  setRejectTarget(approval);
                  setRejectReason('');
                },
              },
            ]}
          />
        ),
      },
      {
        id: 'user',
        label: 'Usuário',
        className: 'min-w-[220px]',
        render: (approval) => (
          <div>
            <p className="font-medium">{approval.user_name}</p>
            <p className="text-xs text-muted-foreground">{approval.user_email}</p>
          </div>
        ),
      },
      {
        id: 'status',
        label: 'Status',
        filter: {
          type: 'select',
          filterKey: 'status',
          placeholder: 'Pendente',
          options: STATUS_FILTER_OPTIONS,
        },
        className: 'min-w-[120px]',
        render: (approval) => (
          <GridBadge variant={statusVariant[approval.status]}>
            {statusLabel[approval.status]}
          </GridBadge>
        ),
      },
      {
        id: 'created_at',
        label: 'Solicitado em',
        className: 'min-w-[160px] text-sm text-muted-foreground whitespace-nowrap',
        render: (approval) => formatDateTime(approval.created_at),
      },
      {
        id: 'reviewed_at',
        label: 'Revisado em',
        className: 'min-w-[160px] text-sm text-muted-foreground whitespace-nowrap',
        render: (approval) => formatDateTime(approval.reviewed_at),
      },
      {
        id: 'rejection_reason',
        label: 'Motivo da rejeição',
        className: 'min-w-[200px] text-sm text-muted-foreground',
        render: (approval) => (
          <span className="line-clamp-2" title={approval.rejection_reason ?? undefined}>
            {approval.rejection_reason ?? '—'}
          </span>
        ),
      },
    ],
    [],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const activeFilters = useMemo(() => {
    const items = [];

    const statusValue = columnFilters.filters.status?.trim();
    if (statusValue) {
      items.push({
        id: 'status',
        label: 'Status',
        value: STATUS_FILTER_OPTIONS.find((option) => option.value === statusValue)?.label ?? statusValue,
        onRemove: () => columnFilters.clearFilter('status'),
      });
    }

    return items;
  }, [columnFilters.clearFilter, columnFilters.filters.status]);

  function handleResetColumns() {
    gridColumns.resetColumns();
    toast.success('Colunas restauradas ao padrão.');
  }

  function handleClearFilters() {
    columnFilters.clearAllFilters();
    toast.success('Filtros removidos.');
  }

  function handleResetGrid() {
    gridColumns.resetColumns();
    columnFilters.clearAllFilters();
    grid.resetSettings();
    toast.success('Grid restaurado ao padrão.');
  }

  const isGridCustomized = columnFilters.hasFilters || grid.isCustomized || gridColumns.isCustomized;

  usePageToolbar({
    title: 'Aprovações',
    description: 'Gerencie solicitações de acesso à organização.',
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
            onRefresh={load}
            isRefreshing={loading}
            filters={{
              active: activeFilters,
              onClearAll: columnFilters.hasFilters ? handleClearFilters : undefined,
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
          data={approvals}
          getRowKey={(approval) => approval.id}
          loading={loading}
          emptyMessage="Nenhuma aprovação encontrada."
          columnFilters={columnFilters.filters}
          onColumnFilterChange={columnFilters.setFilter}
          onColumnFilterClear={columnFilters.clearColumnFilter}
          onColumnOrderChange={gridColumns.reorderDraggableColumns}
        />
      </GridPanel>

      <AlertDialog open={approveTarget !== null} onOpenChange={() => setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar cadastro</AlertDialogTitle>
            <AlertDialogDescription>
              Aprovar o acesso de <strong>{approveTarget?.user_name}</strong> ({approveTarget?.user_email})?
              O usuário receberá um e-mail de confirmação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleApprove()} disabled={processing}>
              <CheckCircle className="mr-2 size-4" /> Aprovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rejectTarget !== null} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar cadastro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Rejeitar o acesso de <strong>{rejectTarget?.user_name}</strong>?
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo (opcional)</label>
              <Textarea
                placeholder="Explique o motivo da rejeição..."
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => void handleReject()}
                disabled={processing}
              >
                <XCircle className="mr-2 size-4" /> Rejeitar
              </Button>
              <Button variant="outline" onClick={() => setRejectTarget(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageBody>
  );
}
