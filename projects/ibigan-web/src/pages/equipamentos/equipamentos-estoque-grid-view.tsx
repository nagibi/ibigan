import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, PackageMinus, Pencil, QrCode, Trash2, Wrench } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useGridColumnLabels } from '@/hooks/use-grid-column-labels';
import { useGrid } from '@/hooks/use-grid';
import { useSyncGridUrl } from '@/hooks/use-sync-grid-url';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridFilters, dateRangeFilterFromKey, dateRangeFilterToKey } from '@/hooks/use-grid-filters';
import { useGridViewMode } from '@/hooks/use-grid-view-mode';
import { GridColumnDataView } from '@/components/grid/grid-column-data-view';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination } from '@/components/grid/grid-pagination';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridRowActions, type GridRowAction } from '@/components/grid/grid-row-actions';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { GridViewModeControl } from '@/components/grid/grid-view-mode-control';
import { formatGridRecordCount, getGridRecordCount } from '@/components/grid/grid-record-count';
import { GridBadge } from '@/components/grid/grid-badge';
import { formatDateRangeFilterLabel } from '@/components/grid/grid-date-range-filter';
import { formatNumberRangeFilterLabel } from '@/components/grid/grid-number-range-filter';
import { getColumnFilterDisplayValue } from '@/lib/grid-filter-display';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { showAppToast } from '@/lib/show-app-toast';
import {
  formatEquipamentoCurrency,
  getEquipamentoTendencia,
} from '@/lib/equipamento-utils';
import { GridQuickFilters } from '@/components/grid/grid-quick-filters';
import {
  applyContextFilterToParams,
  FILTER_LABELS,
  getFiltersForMode,
  resolveContextFilter,
  type EstoqueFilter,
} from '@/lib/equipamento-filters';
import { EQUIPAMENTO_SEARCH_PLACEHOLDER } from '@/lib/equipamento-search';
import { parseGridUrlState } from '@/lib/grid-url-state';
import { toggleActiveLabelsFromEntity } from '@/lib/toggle-active-alert';
import { equipamentosService, type EquipamentosListParams } from '@/services/equipamentos.service';
import type { Equipamento } from '@/types/equipamento';
import { VIEW_PREFERENCE_KEYS } from '@/types/view-mode';
import { EquipamentoPotencialDevolucaoBanner } from '@/pages/equipamentos/components/equipamento-potencial-devolucao-banner';
import { EquipamentoPageStack } from '@/pages/equipamentos/components/equipamento-page-stack';
import { EquipamentoStatsBar } from '@/pages/equipamentos/components/equipamento-stats-bar';
import { EquipamentoThumbnail } from '@/pages/equipamentos/components/equipamento-thumbnail';
import { EquipamentoUtilizacaoBar } from '@/pages/equipamentos/components/equipamento-utilizacao-bar';
import { useEquipamentoPotencialDevolucao } from '@/hooks/use-equipamento-potencial-devolucao';
import { EquipamentoQrModal } from '@/pages/equipamentos/components/equipamento-qr-modal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { AlertDialogPanelTitle } from '@/components/common/panel-title';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  BaixaModal,
  CadastroEquipamentoModal,
  EditarEquipamentoModal,
  EmprestarModal,
  HistoricoModal,
  ManutencaoModal,
} from '@/pages/equipamentos/components/equipamento-modals';

const GRID_COLUMNS_KEY = 'grid-columns:equipamentos-estoque-v2';

function formatAuditDate(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), 'dd/MM/yy HH:mm', { locale: ptBR });
}

function getAuditUserName(
  equipamento: Equipamento,
  field: 'created_by' | 'updated_by',
) {
  return equipamento[field]?.name ?? '—';
}

const CRITICO_FILTER_OPTIONS = [
  { label: 'Sim', value: 'true' },
  { label: 'Não', value: 'false' },
];

const ATIVO_FILTER_OPTIONS = CRITICO_FILTER_OPTIONS;

const SITUACAO_FILTER_OPTIONS = [
  { label: 'Disponível para empréstimo', value: 'disponivel' },
  { label: 'Parado', value: 'parado' },
  { label: 'Parado 30+ dias', value: 'parado_30' },
];

type ModalKind = 'emprestar' | 'manutencao' | 'baixa' | 'historico' | 'editar' | 'qr';

function toSelectOptions(items: Array<{ id: number; nome: string; codigo?: string }>) {
  return items.map((item) => ({
    label: item.codigo ? `${item.codigo} · ${item.nome}` : item.nome,
    value: String(item.id),
  }));
}

function applyColumnFiltersToParams(
  params: EquipamentosListParams,
  filters: Record<string, string>,
): EquipamentosListParams {
  const next = { ...params };

  if (filters.id?.trim()) {
    const id = Number(filters.id.trim());
    if (!Number.isNaN(id)) next.id = id;
  }

  if (filters.patrimonio?.trim()) {
    next.patrimonio = filters.patrimonio.trim();
  }

  if (filters.tipo_id?.trim()) {
    next.tipo_id = Number(filters.tipo_id);
  }

  if (filters.grupo_id?.trim()) {
    next.grupo_id = Number(filters.grupo_id);
  }

  if (filters.obra_id?.trim()) {
    next.obra_id = Number(filters.obra_id);
  }

  if (filters.fornecedor_id?.trim()) {
    next.fornecedor_id = Number(filters.fornecedor_id);
  }

  if (filters.is_critico === 'true') {
    next.is_critico = true;
  } else if (filters.is_critico === 'false') {
    next.is_critico = false;
  }

  if (filters.is_active === 'true') {
    next.is_active = true;
  } else if (filters.is_active === 'false') {
    next.is_active = false;
  }

  const paradoFrom = filters[dateRangeFilterFromKey('parado_dias')]?.trim();
  const paradoTo = filters[dateRangeFilterToKey('parado_dias')]?.trim();

  if (paradoFrom) {
    const min = Number(paradoFrom);
    if (!Number.isNaN(min)) next.parado_dias_min = min;
  }

  if (paradoTo) {
    const max = Number(paradoTo);
    if (!Number.isNaN(max)) next.parado_dias_max = max;
  }

  const valorFrom = filters[dateRangeFilterFromKey('valor_mensal')]?.trim();
  const valorTo = filters[dateRangeFilterToKey('valor_mensal')]?.trim();

  if (valorFrom) {
    const min = Number(valorFrom);
    if (!Number.isNaN(min)) next.valor_mensal_min = min;
  }

  if (valorTo) {
    const max = Number(valorTo);
    if (!Number.isNaN(max)) next.valor_mensal_max = max;
  }

  if (filters.situacao?.trim()) {
    next.situacao = filters.situacao.trim() as EquipamentosListParams['situacao'];
  }

  const createdFrom = filters[dateRangeFilterFromKey('created_at')]?.trim();
  const createdTo = filters[dateRangeFilterToKey('created_at')]?.trim();
  if (createdFrom) next.created_at_from = createdFrom;
  if (createdTo) next.created_at_to = createdTo;

  const updatedFrom = filters[dateRangeFilterFromKey('updated_at')]?.trim();
  const updatedTo = filters[dateRangeFilterToKey('updated_at')]?.trim();
  if (updatedFrom) next.updated_at_from = updatedFrom;
  if (updatedTo) next.updated_at_to = updatedTo;

  if (filters.created_by?.trim()) {
    next.created_by = filters.created_by.trim();
  }

  if (filters.updated_by?.trim()) {
    next.updated_by = filters.updated_by.trim();
  }

  return next;
}

function getRowActions(
  equipamento: Equipamento,
  openModal: (equipamento: Equipamento, kind: ModalKind) => void,
): GridRowAction[] {
  return [
    {
      label: 'Enviar para manutenção',
      icon: Wrench,
      onClick: () => openModal(equipamento, 'manutencao'),
    },
    {
      label: 'Baixar',
      icon: PackageMinus,
      onClick: () => openModal(equipamento, 'baixa'),
      tone: 'destructive',
    },
    {
      label: 'Histórico',
      icon: History,
      onClick: () => openModal(equipamento, 'historico'),
    },
    {
      label: 'Editar',
      icon: Pencil,
      onClick: () => openModal(equipamento, 'editar'),
    },
    {
      label: 'QR Code',
      icon: QrCode,
      onClick: () => openModal(equipamento, 'qr'),
    },
  ];
}

export function EquipamentosEstoqueGridView() {
  const { t } = useTranslation();
  const cols = useGridColumnLabels();
  const { showError, showToggleActive } = useApiToolbarAlert();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialUrlState = useRef(parseGridUrlState(searchParams)).current;

  const invalidateEquipamentos = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['equipamentos'] });
  }, [queryClient]);

  const grid = useGrid({
    defaultPage: initialUrlState.page,
    defaultPerPage: initialUrlState.perPage,
    defaultSearch: initialUrlState.search,
    defaultSort: initialUrlState.sort,
    defaultSortDir: initialUrlState.sortDir,
    onActivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => equipamentosService.toggleActive(id, true)));
        showAppToast({
          title: ids.length === 1 ? 'Equipamento ativado.' : `${ids.length} equipamentos ativados.`,
        });
        invalidateEquipamentos();
      } catch (error) {
        showAppToast({
          title: getApiErrorMessage(error, 'Erro ao ativar equipamento.'),
          variant: 'destructive',
        });
        throw error;
      }
    },
    onDeactivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => equipamentosService.toggleActive(id, false)));
        showAppToast({
          title:
            ids.length === 1 ? 'Equipamento inativado.' : `${ids.length} equipamentos inativados.`,
        });
        invalidateEquipamentos();
      } catch (error) {
        showAppToast({
          title: getApiErrorMessage(error, 'Erro ao inativar equipamento.'),
          variant: 'destructive',
        });
        throw error;
      }
    },
  });
  const { viewMode, setViewMode } = useGridViewMode(VIEW_PREFERENCE_KEYS.equipamentosEstoque);
  const { setPage } = grid;
  const columnFilters = useGridFilters(() => setPage(1), {
    defaultFilters: initialUrlState.filters,
  });

  const [filtro, setFiltro] = useState<EstoqueFilter>(() =>
    resolveContextFilter('estoque', searchParams.get('filtro')) as EstoqueFilter,
  );

  useSyncGridUrl({
    page: grid.page,
    perPage: grid.perPage,
    debouncedSearch: grid.debouncedSearch,
    sort: grid.sort,
    sortDir: grid.sortDir,
    debouncedFilters: columnFilters.debouncedFilters,
    contextFilter: filtro !== 'todos' ? filtro : null,
  });

  useEffect(() => {
    setFiltro(resolveContextFilter('estoque', searchParams.get('filtro')) as EstoqueFilter);
  }, [searchParams]);

  const [selected, setSelected] = useState<Equipamento | null>(null);
  const [activeModal, setActiveModal] = useState<ModalKind | null>(null);
  const [cadastroOpen, setCadastroOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowStatusId, setRowStatusId] = useState<number | null>(null);

  const handleQuickFilterChange = useCallback(
    (value: EstoqueFilter) => {
      setFiltro(value);
      setPage(1);
    },
    [setPage],
  );

  const estoqueQuickFilterOptions = useMemo(
    () =>
      getFiltersForMode('estoque').map((filter) => ({
        value: filter as EstoqueFilter,
        label: FILTER_LABELS[filter],
      })),
    [],
  );

  const { data: obras = [] } = useQuery({
    queryKey: ['equipamentos-lookups', 'obras'],
    queryFn: () => equipamentosService.lookupObras(),
    staleTime: 60_000,
  });

  const { data: fornecedores = [] } = useQuery({
    queryKey: ['equipamentos-lookups', 'fornecedores'],
    queryFn: () => equipamentosService.lookupFornecedores(),
    staleTime: 60_000,
  });

  const { data: tipos = [] } = useQuery({
    queryKey: ['equipamentos-lookups', 'tipos'],
    queryFn: () => equipamentosService.lookupTipos(),
    staleTime: 60_000,
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['equipamentos-lookups', 'grupos'],
    queryFn: () => equipamentosService.lookupGrupos(),
    staleTime: 60_000,
  });

  const obraOptions = useMemo(() => toSelectOptions(obras), [obras]);
  const fornecedorOptions = useMemo(() => toSelectOptions(fornecedores), [fornecedores]);
  const tipoOptions = useMemo(() => toSelectOptions(tipos), [tipos]);
  const grupoOptions = useMemo(() => toSelectOptions(grupos), [grupos]);

  useEffect(() => {
    setPage(1);
  }, [grid.debouncedSearch, grid.sort, grid.sortDir, filtro, columnFilters.debouncedFilters, setPage]);

  const listParams = useMemo((): EquipamentosListParams => {
    const search = grid.debouncedSearch.trim();
    const params: EquipamentosListParams = {
      ...(search ? {} : { status: 'em_estoque' }),
      search: search || undefined,
      page: grid.page,
      per_page: grid.perPage,
      sort: grid.sort ?? undefined,
      direction: grid.sort ? grid.sortDir : undefined,
    };

    const withContext = applyContextFilterToParams('estoque', filtro, params);
    return applyColumnFiltersToParams(withContext, columnFilters.debouncedFilters);
  }, [
    grid.debouncedSearch,
    grid.page,
    grid.perPage,
    grid.sort,
    grid.sortDir,
    filtro,
    columnFilters.debouncedFilters,
  ]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['equipamentos', 'estoque', 'grid', listParams] as const,
    queryFn: () => equipamentosService.list(listParams),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const { data: potencialDevolucao, isLoading: loadingPotencialDevolucao } =
    useEquipamentoPotencialDevolucao(true);

  const items = data?.data ?? [];
  const meta = data?.meta;

  const openModal = useCallback((equipamento: Equipamento, kind: ModalKind) => {
    setSelected(equipamento);
    setActiveModal(kind);
  }, []);

  const closeModal = () => {
    setActiveModal(null);
    setSelected(null);
  };

  const refresh = () => {
    invalidateEquipamentos();
  };

  const handleEditSelected = useCallback(() => {
    if (!grid.singleSelection) return;

    const equipamento = items.find((item) => item.id === grid.selected[0]);
    if (equipamento) {
      openModal(equipamento, 'editar');
    }
  }, [grid.selected, grid.singleSelection, items, openModal]);

  const handleDeleteSelected = useCallback(() => {
    if (!grid.hasSelection) return;
    grid.requestDelete(grid.selected);
  }, [grid.hasSelection, grid.requestDelete, grid.selected]);

  const handleEscape = useCallback(() => {
    if (grid.deleteIds.length > 0) {
      grid.clearDeleteRequest();
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

  async function handleDelete() {
    if (grid.deleteIds.length === 0) return;

    try {
      setIsDeleting(true);
      await Promise.all(grid.deleteIds.map((id) => equipamentosService.destroy(id)));
      showAppToast({
        title:
          grid.deleteIds.length === 1
            ? 'Equipamento removido.'
            : `${grid.deleteIds.length} equipamentos removidos.`,
      });
      grid.clearDeleteRequest();
      grid.clearSelection();
      refresh();
    } catch (error) {
      showAppToast({
        title: getApiErrorMessage(error, 'Erro ao remover equipamento.'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onNew={() => setCadastroOpen(true)}
        newLabel="Novo"
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
      grid.activateSelected,
      grid.deactivateSelected,
      grid.hasSelection,
      grid.isTogglingActive,
      grid.singleSelection,
      handleDeleteSelected,
      handleEditSelected,
    ],
  );

  const toolbarTitle = useMemo(
    () => (
      <>
        <span className="min-w-0 truncate">Estoque</span>
        {typeof meta?.total === 'number' ? (
          <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
            {formatGridRecordCount({ total: meta.total }, t)}
          </span>
        ) : null}
      </>
    ),
    [meta?.total, t],
  );

  usePageToolbar({
    title: toolbarTitle,
    description: 'Equipamentos disponíveis para empréstimo',
    actions: toolbarActions,
  });

  async function handleRowStatusChange(equipamento: Equipamento, active: boolean) {
    const currentlyActive = equipamento.is_active !== false;
    if (currentlyActive === active) return;

    try {
      setRowStatusId(equipamento.id);
      await equipamentosService.toggleActive(equipamento.id, active);
      showToggleActive(active, toggleActiveLabelsFromEntity('equipamento'));
      invalidateEquipamentos();
    } catch (error) {
      showError('Erro ao atualizar status do equipamento.', error);
    } finally {
      setRowStatusId(null);
    }
  }

  const columnDefinitions = useMemo<GridColumnDef<Equipamento>[]>(
    () => [
      {
        id: 'select',
        label: cols.select,
        pinned: 'start',
        hideable: false,
        className: 'w-[40px]',
        render: (row) => (
          <Checkbox
            checked={grid.selected.includes(row.id)}
            onCheckedChange={() => grid.toggleSelect(row.id)}
            onClick={(event) => event.stopPropagation()}
          />
        ),
      },
      {
        id: 'id',
        label: cols.id,
        sortable: true,
        className: 'w-[72px] tabular-nums text-muted-foreground',
        filter: {
          type: 'text',
          filterKey: 'id',
          placeholder: cols.id,
          inputMode: 'numeric',
        },
        render: (row) => row.id,
        exportValue: (row) => row.id,
      },
      {
        id: 'actions',
        label: cols.actions,
        hideable: false,
        className: 'min-w-[100px] w-[100px]',
        render: (row) => <GridRowActions actions={getRowActions(row, openModal)} />,
      },
      {
        id: 'is_active',
        label: cols.active,
        sortable: true,
        sortKey: 'is_active',
        filter: {
          type: 'select',
          filterKey: 'is_active',
          placeholder: cols.all,
          options: ATIVO_FILTER_OPTIONS,
        },
        className: 'w-[80px]',
        exportValue: (row) => (row.is_active !== false ? 'Sim' : 'Não'),
        render: (row) => (
          <Switch
            checked={row.is_active !== false}
            disabled={rowStatusId === row.id}
            onCheckedChange={(checked) => void handleRowStatusChange(row, checked)}
          />
        ),
      },
      {
        id: 'patrimonio',
        label: 'Patrimônio',
        sortable: true,
        pinned: 'start',
        hideable: false,
        filter: {
          type: 'text',
          filterKey: 'patrimonio',
          placeholder: 'Patrimônio',
        },
        render: (row) => (
          <div className="flex items-center gap-2">
            <EquipamentoThumbnail equipamento={row} size="sm" previewEnabled />
            <span className="font-medium">{row.patrimonio}</span>
          </div>
        ),
        exportValue: (row) => row.patrimonio,
      },
      {
        id: 'tipo',
        label: 'Equipamento',
        sortable: true,
        filter: {
          type: 'select',
          filterKey: 'tipo_id',
          placeholder: 'Todos',
          options: tipoOptions,
        },
        render: (row) => row.tipo?.nome ?? '—',
        exportValue: (row) => row.tipo?.nome ?? '',
      },
      {
        id: 'grupo',
        label: 'Categoria',
        sortable: true,
        filter: {
          type: 'select',
          filterKey: 'grupo_id',
          placeholder: 'Todas',
          options: grupoOptions,
        },
        render: (row) => row.tipo?.grupo?.nome ?? '—',
        exportValue: (row) => row.tipo?.grupo?.nome ?? '',
      },
      {
        id: 'obra',
        label: 'Obra',
        sortable: true,
        filter: {
          type: 'select',
          filterKey: 'obra_id',
          placeholder: 'Todas',
          options: obraOptions,
        },
        render: (row) => row.obra?.codigo ?? '—',
        exportValue: (row) => row.obra?.codigo ?? '',
      },
      {
        id: 'fornecedor',
        label: 'Fornecedor',
        sortable: true,
        filter: {
          type: 'select',
          filterKey: 'fornecedor_id',
          placeholder: 'Todos',
          options: fornecedorOptions,
        },
        render: (row) => row.fornecedor?.nome ?? '—',
        exportValue: (row) => row.fornecedor?.nome ?? '',
      },
      {
        id: 'valor_mensal',
        label: 'Valor/mês',
        sortable: true,
        className: 'text-right',
        filter: {
          type: 'numberRange',
          filterKey: 'valor_mensal',
          placeholder: 'Mín',
          numberRangeFormat: 'currency',
        },
        render: (row) => (
          <span className="tabular-nums">{formatEquipamentoCurrency(row.valor_mensal)}</span>
        ),
        exportValue: (row) => formatEquipamentoCurrency(row.valor_mensal),
      },
      {
        id: 'tempo_em_estoque',
        label: 'Parado',
        sortable: true,
        className: 'text-right',
        filter: {
          type: 'numberRange',
          filterKey: 'parado_dias',
          placeholder: 'Mín',
        },
        render: (row) => {
          const dias = row.tempo_em_estoque ?? 0;
          if (dias <= 0) return <span className="text-muted-foreground">—</span>;
          return (
            <span
              className={
                dias >= 30 ? 'font-medium text-amber-700 dark:text-amber-400' : 'tabular-nums'
              }
            >
              {dias}d
            </span>
          );
        },
        exportValue: (row) => row.tempo_em_estoque ?? 0,
      },
      {
        id: 'critico',
        label: 'Crítico',
        sortable: true,
        sortKey: 'is_critico',
        filter: {
          type: 'select',
          filterKey: 'is_critico',
          placeholder: 'Todos',
          options: CRITICO_FILTER_OPTIONS,
        },
        render: (row) =>
          row.is_critico ? (
            <GridBadge tone="destructive">Sim</GridBadge>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
        exportValue: (row) => (row.is_critico ? 'Sim' : 'Não'),
      },
      {
        id: 'tendencia',
        label: 'Situação',
        filter: {
          type: 'select',
          filterKey: 'situacao',
          placeholder: 'Todas',
          options: SITUACAO_FILTER_OPTIONS,
        },
        render: (row) => {
          const tendencia = getEquipamentoTendencia(row);
          if (!tendencia) return '—';

          const tone =
            tendencia.tone === 'danger'
              ? 'destructive'
              : tendencia.tone === 'warning'
                ? 'warning'
                : tendencia.tone === 'success'
                  ? 'success'
                  : 'muted';

          return <GridBadge tone={tone}>{tendencia.label}</GridBadge>;
        },
        exportValue: (row) => getEquipamentoTendencia(row)?.label ?? '',
      },
      {
        id: 'created_at',
        label: cols.createdAt,
        sortable: true,
        sortKey: 'created_at',
        filter: { type: 'dateRange', filterKey: 'created_at' },
        className: 'min-w-[150px] text-sm text-muted-foreground whitespace-nowrap',
        render: (row) => formatAuditDate(row.created_at),
        exportValue: (row) => row.created_at ?? '',
      },
      {
        id: 'created_by',
        label: cols.createdBy,
        filter: { type: 'text', filterKey: 'created_by', placeholder: 'Usuário' },
        className: 'min-w-[160px] text-sm text-muted-foreground',
        render: (row) => getAuditUserName(row, 'created_by'),
        exportValue: (row) => row.created_by?.name ?? '',
      },
      {
        id: 'updated_at',
        label: cols.updatedAt,
        sortable: true,
        sortKey: 'updated_at',
        filter: { type: 'dateRange', filterKey: 'updated_at' },
        className: 'min-w-[160px] text-sm text-muted-foreground whitespace-nowrap',
        render: (row) => formatAuditDate(row.updated_at),
        exportValue: (row) => row.updated_at ?? '',
      },
      {
        id: 'updated_by',
        label: cols.updatedBy,
        filter: { type: 'text', filterKey: 'updated_by', placeholder: 'Usuário' },
        className: 'min-w-[170px] text-sm text-muted-foreground',
        render: (row) => getAuditUserName(row, 'updated_by'),
        exportValue: (row) => row.updated_by?.name ?? '',
      },
    ],
    [cols, fornecedorOptions, grid.selected, grid.toggleSelect, grupoOptions, obraOptions, openModal, rowStatusId, tipoOptions],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const handleResetGrid = () => {
    columnFilters.clearAllFilters();
    grid.clearSearch();
    grid.resetSettings();
    gridColumns.resetColumns();
    setFiltro('todos');
    setPage(1);
  };

  const handleClearAllFilters = () => {
    columnFilters.clearAllFilters();
    grid.clearSearch();
    setFiltro('todos');
  };

  const activeFilters = useMemo(() => {
    const items = [];

    if (filtro !== 'todos') {
      items.push({
        id: 'filtro',
        label: 'Filtro rápido',
        value: FILTER_LABELS[filtro],
        onRemove: () => handleQuickFilterChange('todos'),
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

    for (const column of columnDefinitions) {
      if (!column.filter) continue;

      if (column.filter.type === 'numberRange') {
        const from =
          columnFilters.filters[dateRangeFilterFromKey(column.filter.filterKey)]?.trim() ?? '';
        const to =
          columnFilters.filters[dateRangeFilterToKey(column.filter.filterKey)]?.trim() ?? '';
        if (!from && !to) continue;

        items.push({
          id: column.filter.filterKey,
          label: column.label,
          value: formatNumberRangeFilterLabel(from, to, {
            variant: column.filter.numberRangeFormat === 'currency' ? 'currency' : 'default',
          }),
          onRemove: () => columnFilters.clearDateRangeFilter(column.filter!.filterKey),
        });
        continue;
      }

      if (column.filter.type === 'dateRange') {
        const from =
          columnFilters.filters[dateRangeFilterFromKey(column.filter.filterKey)]?.trim() ?? '';
        const to =
          columnFilters.filters[dateRangeFilterToKey(column.filter.filterKey)]?.trim() ?? '';
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

      items.push({
        id: column.filter.filterKey,
        label: column.label,
        value: getColumnFilterDisplayValue(column.filter, value),
        onRemove: () => columnFilters.clearColumnFilter(column.filter!),
      });
    }

    return items;
  }, [
    columnDefinitions,
    columnFilters.filters,
    columnFilters.clearColumnFilter,
    columnFilters.clearDateRangeFilter,
    filtro,
    grid.clearSearch,
    grid.search,
    handleQuickFilterChange,
  ]);

  const hasActiveFilters =
    columnFilters.hasFilters || grid.hasFilters || filtro !== 'todos';
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  const pagination = meta ? (
    <GridPagination
      meta={meta}
      perPage={grid.perPage}
      onPageChange={grid.setPage}
      onPerPageChange={grid.setPerPage}
    />
  ) : null;

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-3 overflow-hidden xl:h-[calc(100dvh-var(--header-height)-var(--page-content-header-height,0px)-0.75rem)] xl:gap-3">
      <EquipamentoPageStack className="shrink-0 xl:hidden">
        <EquipamentoStatsBar />
        <EquipamentoUtilizacaoBar />
        <EquipamentoPotencialDevolucaoBanner
          data={potencialDevolucao}
          isLoading={loadingPotencialDevolucao}
        />
      </EquipamentoPageStack>

      <GridPanel
        className="min-h-0 flex-1"
        toolbar={
          <GridPanelToolbar
            onSelectAll={() => grid.toggleSelectAll(items.map((item) => item.id))}
            isAllSelected={grid.isAllSelected(items.length)}
            selectedCount={grid.selected.length}
            onClearSelection={grid.clearSelection}
            onRefresh={refresh}
            isRefreshing={isFetching}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder={EQUIPAMENTO_SEARCH_PLACEHOLDER}
            quickFiltersControl={
              <GridQuickFilters
                value={filtro}
                onChange={handleQuickFilterChange}
                defaultValue="todos"
                options={estoqueQuickFilterOptions}
              />
            }
            filters={{
              active: activeFilters,
              onClearAll: hasActiveFilters ? handleClearAllFilters : undefined,
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
                onResetDefault={gridColumns.resetToDefault}
              />
            }
            resetControl={
              <GridResetControl disabled={!isGridCustomized} onReset={handleResetGrid} />
            }
            viewModeControl={
              <GridViewModeControl viewMode={viewMode} onViewModeChange={setViewMode} />
            }
            recordCount={getGridRecordCount(meta?.total ?? 0, items.length, false)}
          />
        }
        footer={pagination}
      >
        <GridColumnDataView
          viewMode={viewMode}
          columns={gridColumns.visibleColumns}
          data={items}
          getRowKey={(row) => row.id}
          loading={isLoading}
          emptyMessage="Nenhum equipamento encontrado."
          titleColumnId="patrimonio"
          getRowActions={(row) => getRowActions(row, openModal)}
          columnFilters={columnFilters.filters}
          onColumnFilterChange={columnFilters.setFilter}
          onDateRangeFilterChange={columnFilters.setDateRangeFilter}
          onColumnFilterClear={columnFilters.clearColumnFilter}
          isRowSelected={(row) => grid.selected.includes(row.id)}
          onRowClick={(row, event) =>
            grid.selectRow(row.id, {
              shift: event.shiftKey,
              rangeOrder: items.map((item) => item.id),
            })
          }
          onRowDoubleClick={(row) => openModal(row, 'emprestar')}
          sort={grid.sort}
          sortDir={grid.sortDir}
          onSort={grid.toggleSort}
        />
      </GridPanel>

      <EmprestarModal
        equipamento={selected}
        open={activeModal === 'emprestar'}
        onOpenChange={(open) => (open ? setActiveModal('emprestar') : closeModal())}
      />
      <ManutencaoModal
        equipamento={selected}
        open={activeModal === 'manutencao'}
        onOpenChange={(open) => (open ? setActiveModal('manutencao') : closeModal())}
      />
      <BaixaModal
        equipamento={selected}
        open={activeModal === 'baixa'}
        onOpenChange={(open) => (open ? setActiveModal('baixa') : closeModal())}
      />
      <HistoricoModal
        equipamento={selected}
        open={activeModal === 'historico'}
        onOpenChange={(open) => (open ? setActiveModal('historico') : closeModal())}
      />
      <EditarEquipamentoModal
        equipamento={selected}
        open={activeModal === 'editar'}
        onOpenChange={(open) => (open ? setActiveModal('editar') : closeModal())}
      />
      <EquipamentoQrModal
        equipamento={selected}
        open={activeModal === 'qr'}
        onOpenChange={(open) => (open ? setActiveModal('qr') : closeModal())}
      />

      <CadastroEquipamentoModal open={cadastroOpen} onOpenChange={setCadastroOpen} />

      <AlertDialog
        open={grid.deleteIds.length > 0}
        onOpenChange={(open) => !open && grid.clearDeleteRequest()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogPanelTitle icon={Trash2}>
              {grid.deleteIds.length === 1
                ? 'Remover equipamento'
                : `Remover ${grid.deleteIds.length} equipamentos`}
            </AlertDialogPanelTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel />
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
