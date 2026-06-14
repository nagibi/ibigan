import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronRight, GripVertical, Trash2 } from 'lucide-react';
import { GRID_VIEW_ICON } from '@/lib/grid-view-action';
import { getColumnFilterDisplayValue, matchesSelectFilterValue } from '@/lib/grid-filter-display';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridExport } from '@/hooks/use-grid-export';
import { useGridToasts } from '@/hooks/use-grid-toasts';
import { useAuthStore } from '@/stores/auth.store';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid, type SortDirection } from '@/hooks/use-grid';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import {
  buildMenuReorderItems,
  flattenMenuTree,
  reorderSiblingMenus,
} from '@/lib/menu-tree-order';
import { resolveMenuIcon } from '@/lib/menu-icons';
import { TOGGLE_ACTIVE_LABELS } from '@/lib/toggle-active-alert';
import { menusService, type ApiMenu } from '@/services/menus.service';
import { PageBody } from '@/components/common/page-body';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { formatDateRangeFilterLabel } from '@/components/grid/grid-date-range-filter';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import {
  dateRangeFilterFromKey,
  dateRangeFilterToKey,
  useGridFilters,
} from '@/hooks/use-grid-filters';
import { GridPagination } from '@/components/grid/grid-pagination';
import { GridPanel } from '@/components/grid/grid-panel';
import { getGridRecordCount } from '@/components/grid/grid-record-count';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridRowActions, type GridRowAction } from '@/components/grid/grid-row-actions';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { GridTableScroll } from '@/components/grid/grid-table-scroll';
import { GridViewModeControl } from '@/components/grid/grid-view-mode-control';
import { DataView } from '@/components/grid/data-view';
import { GridCardsView, GridListView } from '@/components/grid/grid-cards-view';
import { MenuCard } from '@/components/cards/menu-card';
import { useViewMode } from '@/hooks/use-view-mode';
import { useIsMobile } from '@/hooks/use-mobile';
import { useClientGridInfiniteScroll } from '@/hooks/use-grid-infinite-scroll';
import { isGridPerPageAll } from '@/lib/grid-pagination-config';
import { shouldUseGridInfiniteScroll } from '@/lib/grid-infinite-scroll';
import { VIEW_PREFERENCE_KEYS } from '@/types/view-mode';
import { getGridRowClassName, GridTableColumnDndContext, GridTableHeader } from '@/components/grid/grid-table';
import { GridBadge } from '@/components/grid/grid-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { AlertDialogPanelTitle } from '@/components/common/panel-title';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const EMPTY_MENUS: ApiMenu[] = [];
const MENUS_GRID_COLUMNS_KEY = 'grid-columns:menus';

const MENU_COLUMN_DEFINITIONS: GridColumnDef<ApiMenu>[] = [
  { id: 'drag', label: '', hideable: false, pinned: 'start', className: 'w-[36px]', render: () => null },
  { id: 'select', label: '#', hideable: false, pinned: 'start', className: 'w-[40px]', render: () => null },
  {
    id: 'id',
    label: 'Id',
    hideable: false,
    sortable: true,
    sortKey: 'id',
    className: 'w-[70px] text-sm text-muted-foreground',
    filter: { type: 'multi', filterKey: 'id', placeholder: 'Id', inputMode: 'numeric' },
    render: () => null,
  },
  { id: 'actions', label: 'Ações', hideable: false, className: 'min-w-[100px] w-[100px]', render: () => null },
  {
    id: 'active',
    label: 'Ativo',
    sortable: true,
    sortKey: 'is_active',
    className: 'w-[80px]',
    filter: {
      type: 'select',
      filterKey: 'is_active',
      placeholder: 'Todos',
      options: [
        { label: 'Ativo', value: 'active' },
        { label: 'Inativo', value: 'inactive' },
      ],
    },
    render: () => null,
  },
  {
    id: 'title',
    label: 'Título',
    sortable: true,
    sortKey: 'title',
    filter: { type: 'text', filterKey: 'title', placeholder: 'Título' },
    render: () => null,
  },
  {
    id: 'path',
    label: 'Caminho',
    sortable: true,
    sortKey: 'path',
    filter: { type: 'text', filterKey: 'path', placeholder: 'Caminho' },
    render: () => null,
  },
  {
    id: 'icon',
    label: 'Ícone',
    sortable: true,
    sortKey: 'icon',
    filter: { type: 'text', filterKey: 'icon', placeholder: 'Ícone' },
    render: () => null,
  },
  {
    id: 'badge',
    label: 'Badge',
    sortable: true,
    sortKey: 'badge',
    filter: { type: 'text', filterKey: 'badge', placeholder: 'Badge' },
    render: () => null,
  },
  {
    id: 'order',
    label: 'Ordem',
    sortable: true,
    sortKey: 'order',
    filter: { type: 'text', filterKey: 'order', placeholder: 'Ordem', inputMode: 'numeric' },
    render: () => null,
  },
  {
    id: 'created_at',
    label: 'Data de cadastro',
    sortable: true,
    sortKey: 'created_at',
    className: 'min-w-[150px]',
    filter: { type: 'dateRange', filterKey: 'created_at' },
    render: () => null,
  },
  {
    id: 'updated_at',
    label: 'Atualização',
    sortable: true,
    sortKey: 'updated_at',
    className: 'min-w-[150px]',
    filter: { type: 'dateRange', filterKey: 'updated_at' },
    render: () => null,
  },
];

type MenuFlatRow = { menu: ApiMenu; depth: number };

function sortMenuFlatRows(
  rows: MenuFlatRow[],
  sort: string | null,
  sortDir: SortDirection,
) {
  if (!sort) {
    return rows;
  }

  const sorted = [...rows];
  sorted.sort((leftRow, rightRow) => {
    const left = leftRow.menu;
    const right = rightRow.menu;
    let cmp = 0;

    switch (sort) {
      case 'id':
        cmp = left.id - right.id;
        break;
      case 'title':
        cmp = left.title.localeCompare(right.title, 'pt-BR');
        break;
      case 'path':
        cmp = (left.path ?? '').localeCompare(right.path ?? '', 'pt-BR');
        break;
      case 'icon':
        cmp = (left.icon ?? '').localeCompare(right.icon ?? '', 'pt-BR');
        break;
      case 'badge':
        cmp = (left.badge ?? '').localeCompare(right.badge ?? '', 'pt-BR');
        break;
      case 'order':
        cmp = left.order - right.order;
        break;
      case 'created_at':
        cmp = (left.created_at ?? '').localeCompare(right.created_at ?? '');
        break;
      case 'updated_at':
        cmp = (left.updated_at ?? '').localeCompare(right.updated_at ?? '');
        break;
      case 'is_active':
        cmp = Number(left.is_active) - Number(right.is_active);
        break;
      default:
        cmp = 0;
    }

    return sortDir === 'asc' ? cmp : -cmp;
  });

  return sorted;
}

function matchesMenuColumnFilters(menu: ApiMenu, filters: Record<string, string>): boolean {
  const idFilter = filters.id?.trim();
  if (idFilter) {
    const ids = parseMultiFilterValue(idFilter);
    if (ids.length > 0 && !ids.includes(String(menu.id))) return false;
  }

  const activeFilter = filters.is_active?.trim();
  if (activeFilter) {
    const isActive = menu.is_active ? 'active' : 'inactive';
    if (!matchesSelectFilterValue(isActive, activeFilter)) return false;
  }

  const title = filters.title?.trim();
  if (title && !menu.title.toLowerCase().includes(title.toLowerCase())) return false;

  const path = filters.path?.trim();
  if (path && !(menu.path ?? '').toLowerCase().includes(path.toLowerCase())) return false;

  const icon = filters.icon?.trim();
  if (icon && !(menu.icon ?? '').toLowerCase().includes(icon.toLowerCase())) return false;

  const badge = filters.badge?.trim();
  if (badge && !(menu.badge ?? '').toLowerCase().includes(badge.toLowerCase())) return false;

  const order = filters.order?.trim();
  if (order && !String(menu.order).includes(order)) return false;

  for (const key of ['created_at', 'updated_at'] as const) {
    const from = filters[dateRangeFilterFromKey(key)]?.trim();
    const to = filters[dateRangeFilterToKey(key)]?.trim();
    if (!from && !to) continue;

    const value = menu[key];
    if (!value) return false;

    const date = parseISO(value);
    if (from && isBefore(date, startOfDay(parseISO(from)))) return false;
    if (to && isAfter(date, endOfDay(parseISO(to)))) return false;
  }

  return true;
}

function isMenuColumnVisible(columnId: string, hidden: string[]) {
  if (MENU_COLUMN_DEFINITIONS.find((column) => column.id === columnId)?.hideable === false) {
    return true;
  }

  return !hidden.includes(columnId);
}

function menuMatchesSearch(menu: ApiMenu, query: string): boolean {
  const q = query.toLowerCase();
  return (
    menu.title.toLowerCase().includes(q)
    || (menu.path?.toLowerCase().includes(q) ?? false)
  );
}

function filterMenuTree(menus: ApiMenu[], query: string): ApiMenu[] {
  const trimmed = query.trim();
  if (!trimmed) return menus;

  return menus.reduce<ApiMenu[]>((acc, menu) => {
    const filteredChildren = filterMenuTree(menu.children ?? [], query);
    if (menuMatchesSearch(menu, trimmed) || filteredChildren.length > 0) {
      acc.push({ ...menu, children: filteredChildren });
    }
    return acc;
  }, []);
}

function formatMenuDate(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), "dd/MM/yy 'às' HH:mm", { locale: ptBR });
}

function collectMenuIds(menus: ApiMenu[]): number[] {
  return menus.flatMap((menu) => [
    menu.id,
    ...collectMenuIds(menu.children ?? []),
  ]);
}

function renderMenuTableCell(
  columnId: string,
  menu: ApiMenu,
  depth: number,
  options: {
    sortable: boolean;
    selected: number[];
    dragAttributes: ReturnType<typeof useSortable>['attributes'];
    dragListeners: ReturnType<typeof useSortable>['listeners'];
    onToggleSelect: (id: number) => void;
    onEdit: (menu: ApiMenu) => void;
    onDelete: (id: number) => void;
    onToggleActive: (menu: ApiMenu, active: boolean) => void;
    rowStatusId: number | null;
  },
) {
  const Icon = resolveMenuIcon({
    icon: menu.icon,
    path: menu.path,
    slug: menu.slug,
    title: menu.title,
  });

  switch (columnId) {
    case 'drag':
      return options.sortable ? (
        <button
          type="button"
          className="inline-flex cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
          aria-label="Reordenar menu"
          {...options.dragAttributes}
          {...options.dragListeners}
        >
          <GripVertical className="size-4" />
        </button>
      ) : (
        <span className="inline-block size-4" />
      );
    case 'select':
      return (
        <div className="flex justify-center">
          <Checkbox
            checked={options.selected.includes(menu.id)}
            onCheckedChange={() => options.onToggleSelect(menu.id)}
          />
        </div>
      );
    case 'id':
      return menu.id;
    case 'actions':
      return (
        <div className="flex justify-center">
          <GridRowActions
            actions={[
              { label: 'Visualizar', icon: GRID_VIEW_ICON, onClick: () => options.onEdit(menu) },
              {
                label: 'Remover',
                icon: Trash2,
                tone: 'destructive',
                onClick: () => options.onDelete(menu.id),
              },
            ]}
          />
        </div>
      );
    case 'active':
      return (
        <Switch
          checked={menu.is_active}
          disabled={options.rowStatusId === menu.id}
          onCheckedChange={(checked) => options.onToggleActive(menu, checked)}
        />
      );
    case 'title':
      return (
        <div className="flex items-center gap-2 whitespace-nowrap" style={{ paddingLeft: `${depth * 20}px` }}>
          {depth > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          <span>{menu.title}</span>
        </div>
      );
    case 'path':
      return <span className="whitespace-nowrap text-sm text-muted-foreground">{menu.path ?? '—'}</span>;
    case 'icon':
      return <GridBadge variant="outline">{menu.icon ?? '—'}</GridBadge>;
    case 'badge':
      return menu.badge ? (
        <GridBadge variant="primary">{menu.badge}</GridBadge>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      );
    case 'order':
      return menu.order;
    case 'created_at':
      return (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatMenuDate(menu.created_at)}
        </span>
      );
    case 'updated_at':
      return (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {formatMenuDate(menu.updated_at)}
        </span>
      );
    default:
      return null;
  }
}

function SortableMenuRow({
  menu,
  depth,
  selected,
  sortable,
  visibleColumns,
  onToggleSelect,
  onEdit,
  onDelete,
  onToggleActive,
  rowStatusId,
}: {
  menu: ApiMenu;
  depth: number;
  selected: number[];
  sortable: boolean;
  visibleColumns: GridColumnDef<ApiMenu>[];
  onToggleSelect: (id: number) => void;
  onEdit: (menu: ApiMenu) => void;
  onDelete: (id: number) => void;
  onToggleActive: (menu: ApiMenu, active: boolean) => void;
  rowStatusId: number | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: menu.id,
    disabled: !sortable,
    animateLayoutChanges: () => false,
  });

  const style = isDragging && transform
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative' as const,
        zIndex: 2,
      }
    : undefined;

  const interactiveColumnIds = new Set(['drag', 'select', 'actions', 'active']);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={selected.includes(menu.id) ? 'selected' : undefined}
      className={getGridRowClassName({
        selected: selected.includes(menu.id),
        interactive: true,
        extra: cn(isDragging && 'opacity-60 bg-muted/50'),
      })}
      onClick={() => onToggleSelect(menu.id)}
    >
      {visibleColumns.map((column) => (
        <TableCell
          key={column.id}
          className={cn(
            column.className,
            (column.id === 'select' || column.id === 'actions') && 'text-center',
          )}
          onClick={interactiveColumnIds.has(column.id)
            ? (event) => event.stopPropagation()
            : undefined}
        >
          {renderMenuTableCell(column.id, menu, depth, {
            sortable,
            selected,
            dragAttributes: attributes,
            dragListeners: listeners,
            onToggleSelect,
            onEdit,
            onDelete,
            onToggleActive,
            rowStatusId,
          })}
        </TableCell>
      ))}
    </TableRow>
  );
}

export function MenusPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.tenantId);
  const gridToasts = useGridToasts();
  const { showSuccess, showToggleActive, showError } = useApiToolbarAlert();
  const gridColumns = useGridColumns(MENUS_GRID_COLUMNS_KEY, MENU_COLUMN_DEFINITIONS);

  const handleActivate = useCallback(async (ids: number[]) => {
    try {
      await Promise.all(ids.map((id) => menusService.toggleActive(id, true)));
      showToggleActive(true, TOGGLE_ACTIVE_LABELS.menu, ids.length);
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
    } catch (error) {
      showError('Erro ao ativar menu(s).', error);
      throw new Error('toggle-active-failed');
    }
  }, [queryClient, showError, showToggleActive]);

  const handleDeactivate = useCallback(async (ids: number[]) => {
    try {
      await Promise.all(ids.map((id) => menusService.toggleActive(id, false)));
      showToggleActive(false, TOGGLE_ACTIVE_LABELS.menu, ids.length);
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
    } catch (error) {
      showError('Erro ao inativar menu(s).', error);
      throw new Error('toggle-active-failed');
    }
  }, [queryClient, showError, showToggleActive]);

  const grid = useGrid({
    onActivate: handleActivate,
    onDeactivate: handleDeactivate,
  });
  const columnFilters = useGridFilters(() => grid.setPage(1));

  const { viewMode, setViewMode } = useViewMode(VIEW_PREFERENCE_KEYS.menus);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [rowStatusId, setRowStatusId] = useState<number | null>(null);
  const [menuTree, setMenuTree] = useState<ApiMenu[]>([]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['menus', tenantId],
    queryFn: () => menusService.list(),
    enabled: Boolean(tenantId),
  });

  const menus = data?.data.result ?? EMPTY_MENUS;

  useEffect(() => {
    setMenuTree(menus);
  }, [menus]);

  const canReorder = !grid.debouncedSearch.trim()
    && !columnFilters.hasFilters
    && !grid.sort
    && !isLoading
    && !isReordering;

  const displayMenus = useMemo(
    () => (grid.debouncedSearch.trim() ? filterMenuTree(menuTree, grid.debouncedSearch) : menuTree),
    [menuTree, grid.debouncedSearch],
  );

  const flatRows = useMemo(() => {
    const rows = flattenMenuTree(displayMenus);
    if (!columnFilters.hasFilters) return rows;

    return rows.filter(({ menu }) => matchesMenuColumnFilters(menu, columnFilters.debouncedFilters));
  }, [columnFilters.debouncedFilters, columnFilters.hasFilters, displayMenus]);

  const sortedFlatRows = useMemo(
    () => sortMenuFlatRows(flatRows, grid.sort, grid.sortDir),
    [flatRows, grid.sort, grid.sortDir],
  );
  const sortableIds = useMemo(() => sortedFlatRows.map((row) => row.menu.id), [sortedFlatRows]);
  const visibleIds = useMemo(() => collectMenuIds(displayMenus), [displayMenus]);

  const paginationMeta = useMemo(() => {
    const pageSize = grid.slicePerPage(sortedFlatRows.length);
    const lastPage = Math.max(1, Math.ceil(sortedFlatRows.length / pageSize));

    return {
      current_page: Math.min(grid.page, lastPage),
      last_page: lastPage,
      per_page: isGridPerPageAll(grid.perPage) ? sortedFlatRows.length : grid.perPage,
      total: sortedFlatRows.length,
    };
  }, [sortedFlatRows.length, grid.page, grid.perPage, grid.slicePerPage]);

  const paginatedFlatRows = useMemo(() => {
    const pageSize = grid.slicePerPage(sortedFlatRows.length);
    const start = (paginationMeta.current_page - 1) * pageSize;
    return sortedFlatRows.slice(start, start + pageSize);
  }, [sortedFlatRows, grid.slicePerPage, paginationMeta.current_page]);

  const isMobile = useIsMobile();
  const infiniteScrollEnabled = shouldUseGridInfiniteScroll(isMobile, viewMode);
  const clientInfinite = useClientGridInfiniteScroll({
    items: sortedFlatRows,
    page: grid.page,
    perPage: grid.perPage,
    setPage: grid.setPage,
    enabled: infiniteScrollEnabled,
    resetDeps: [grid.debouncedSearch, columnFilters.debouncedFilters, sortedFlatRows.length, grid.sort, grid.sortDir],
  });
  const cardListRows = infiniteScrollEnabled ? clientInfinite.displayItems : paginatedFlatRows;

  const activeFilters = useMemo(() => {
    const items = [];

    if (grid.debouncedSearch.trim()) {
      items.push({
        id: 'search',
        label: 'Busca',
        value: grid.debouncedSearch.trim(),
        onRemove: grid.clearSearch,
      });
    }

    for (const column of MENU_COLUMN_DEFINITIONS) {
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

      const displayValue = getColumnFilterDisplayValue(column.filter, value);

      items.push({
        id: column.filter.filterKey,
        label: column.label,
        value: displayValue,
        onRemove: () => columnFilters.clearFilter(column.filter!.filterKey),
      });
    }

    return items;
  }, [
    columnFilters.clearDateRangeFilter,
    columnFilters.clearFilter,
    columnFilters.filters,
    grid.clearSearch,
    grid.debouncedSearch,
  ]);

  const hasActiveFilters = grid.hasFilters || columnFilters.hasFilters;
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  function handleClearFilters() {
    grid.clearSearch();
    columnFilters.clearAllFilters();
    gridToasts.filtersCleared();
  }

  function handleResetGrid() {
    gridColumns.resetColumns();
    grid.resetSettings();
    grid.clearSearch();
    columnFilters.clearAllFilters();
    grid.clearSelection();
    gridToasts.gridRestored();
  }

  const exportMenus = useMemo(
    () => cardListRows.map(({ menu }) => menu),
    [cardListRows],
  );

  const { handleExport, isExporting } = useGridExport({
    filename: 'menus',
    columns: gridColumns.visibleColumns,
    rows: exportMenus,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const persistReorder = useCallback(async (nextTree: ApiMenu[]) => {
    const previousTree = menuTree;

    setMenuTree(nextTree);

    try {
      setIsReordering(true);
      await menusService.reorder(buildMenuReorderItems(nextTree));
      showSuccess('Ordem dos menus atualizada.');
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
    } catch (error) {
      setMenuTree(previousTree);
      showError('Erro ao reordenar menus.', error);
    } finally {
      setIsReordering(false);
    }
  }, [menuTree, queryClient, showError, showSuccess]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);
    const nextTree = reorderSiblingMenus(menuTree, activeId, overId);

    if (!nextTree) {
      showError('Só é possível reordenar itens do mesmo nível.');
      return;
    }

    void persistReorder(nextTree);
  }, [menuTree, persistReorder, showError]);

  const handleEdit = useCallback(
    (menu: ApiMenu) => navigate(`/menus/${menu.id}`),
    [navigate],
  );

  const getMenuRowActions = useCallback(
    (menu: ApiMenu): GridRowAction[] => [
      { label: 'Visualizar', icon: GRID_VIEW_ICON, onClick: () => handleEdit(menu) },
      {
        label: 'Remover',
        icon: Trash2,
        tone: 'destructive',
        onClick: () => grid.requestDelete([menu.id]),
      },
    ],
    [handleEdit, grid.requestDelete],
  );

  const handleEditSelected = useCallback(() => {
    if (!grid.singleSelection) return;
    navigate(`/menus/${grid.selected[0]}`);
  }, [grid.singleSelection, grid.selected, navigate]);

  const handleDeleteSelected = useCallback(() => {
    if (!grid.hasSelection) return;
    grid.requestDelete(grid.selected);
  }, [grid.hasSelection, grid.requestDelete, grid.selected]);

  const handleDelete = useCallback(async () => {
    if (grid.deleteIds.length === 0) return;

    try {
      setIsDeleting(true);
      await Promise.all(grid.deleteIds.map((id) => menusService.destroy(id)));
      showSuccess(
        grid.deleteIds.length === 1
          ? 'Menu removido.'
          : `${grid.deleteIds.length} menus removidos.`,
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
    } catch (error) {
      showError('Erro ao remover menu(s).', error);
    } finally {
      setIsDeleting(false);
    }
  }, [grid, queryClient, showError, showSuccess]);

  const handleRowStatusChange = useCallback(async (menu: ApiMenu, active: boolean) => {
    if (menu.is_active === active) return;

    try {
      setRowStatusId(menu.id);
      await menusService.toggleActive(menu.id, active);
      showToggleActive(active, TOGGLE_ACTIVE_LABELS.menu);
      await queryClient.invalidateQueries({ queryKey: ['menus'] });
    } catch (error) {
      showError('Erro ao atualizar status do menu.', error);
    } finally {
      setRowStatusId(null);
    }
  }, [queryClient, showError, showToggleActive]);

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

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onNew={() => navigate('/menus/new')}
        onEdit={handleEditSelected}
        onDelete={handleDeleteSelected}
        onActivate={() => void grid.activateSelected()}
        onDeactivate={() => void grid.deactivateSelected()}
        onExport={handleExport}
        isExporting={isExporting}
        hasSelection={grid.hasSelection}
        singleSelection={grid.singleSelection}
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
      handleExport,
      isExporting,
      navigate,
    ],
  );

  usePageToolbar({
    title: 'Menus',
    description: 'Gerencie a navegação do sistema. Arraste pelo ícone para reordenar.',
    actions: toolbarActions,
  });

  const allVisibleSelected = visibleIds.length > 0
    && visibleIds.every((id) => grid.selected.includes(id));

  const menusEmptyMessage = grid.debouncedSearch.trim()
    ? 'Nenhum menu encontrado para a busca.'
    : 'Nenhum menu cadastrado.';

  const visibleTableColumnCount = gridColumns.visibleColumns.length;

  const tableBody = (
    <>
      {isLoading ? (
        <TableRow>
          <TableCell colSpan={visibleTableColumnCount} className="py-8 text-center text-muted-foreground">
            Carregando...
          </TableCell>
        </TableRow>
      ) : flatRows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={visibleTableColumnCount} className="py-8 text-center text-muted-foreground">
            {menusEmptyMessage}
          </TableCell>
        </TableRow>
      ) : (
        paginatedFlatRows.map(({ menu, depth }) => (
          <SortableMenuRow
            key={menu.id}
            menu={menu}
            depth={depth}
            sortable={canReorder}
            visibleColumns={gridColumns.visibleColumns}
            selected={grid.selected}
            onToggleSelect={grid.toggleSelect}
            onEdit={handleEdit}
            onDelete={(id) => grid.requestDelete([id])}
            onToggleActive={(m, active) => void handleRowStatusChange(m, active)}
            rowStatusId={rowStatusId}
          />
        ))
      )}
    </>
  );

  const tableView = (
    <GridTableScroll>
      <GridTableColumnDndContext
        columns={gridColumns.visibleColumns}
        onColumnOrderChange={gridColumns.reorderDraggableColumns}
      >
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <table className="w-max min-w-full table-auto caption-bottom text-sm text-foreground">
            <GridTableHeader
              columns={gridColumns.visibleColumns}
              sort={grid.sort}
              sortDir={grid.sortDir}
              onSort={grid.toggleSort}
              enableColumnReorder
              columnFilters={columnFilters.filters}
              onColumnFilterChange={columnFilters.setFilter}
              onDateRangeFilterChange={columnFilters.setDateRangeFilter}
              onColumnFilterClear={columnFilters.clearColumnFilter}
            />
            {canReorder ? (
              <TableBody>
                <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                  {tableBody}
                </SortableContext>
              </TableBody>
            ) : (
              <TableBody>{tableBody}</TableBody>
            )}
          </table>
        </DndContext>
      </GridTableColumnDndContext>
    </GridTableScroll>
  );

  return (
    <PageBody>
      <GridPanel
        toolbar={(
          <GridPanelToolbar
            onSelectAll={() => grid.toggleSelectAll(visibleIds)}
            isAllSelected={allVisibleSelected}
            selectedCount={grid.selected.length}
            onClearSelection={grid.clearSelection}
            onExport={handleExport}
            isExporting={isExporting}
            search={grid.search}
            onSearch={grid.setSearch}
            filters={{
              active: activeFilters,
              onClearAll: hasActiveFilters ? handleClearFilters : undefined,
              columnFilters: {
                columns: MENU_COLUMN_DEFINITIONS.filter((column) => isMenuColumnVisible(column.id, gridColumns.hidden)),
                values: columnFilters.filters,
                onFilterChange: columnFilters.setFilter,
                onDateRangeChange: columnFilters.setDateRangeFilter,
                onFilterClear: columnFilters.clearColumnFilter,
              },
            }}
            columnsControl={(
              <GridColumnsControl
                columns={MENU_COLUMN_DEFINITIONS}
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
                  gridToasts.columnsRestored();
                }}
              />
            )}
            resetControl={(
              <GridResetControl
                disabled={!isGridCustomized}
                onReset={handleResetGrid}
              />
            )}
            viewModeControl={
              <GridViewModeControl viewMode={viewMode} onViewModeChange={setViewMode} />
            }
            recordCount={getGridRecordCount(sortedFlatRows.length, cardListRows.length, infiniteScrollEnabled)}
          />
        )}
        footer={!infiniteScrollEnabled ? (
          <GridPagination
            meta={paginationMeta}
            perPage={grid.perPage}
            onPageChange={grid.setPage}
            onPerPageChange={grid.setPerPage}
          />
        ) : undefined}
      >
        <DataView
          viewMode={viewMode}
          loading={isLoading}
          isEmpty={!isLoading && sortedFlatRows.length === 0}
          emptyMessage={menusEmptyMessage}
          infiniteScroll={infiniteScrollEnabled ? {
            enabled: true,
            hasMore: clientInfinite.hasMore,
            onLoadMore: clientInfinite.loadMore,
            loadedCount: clientInfinite.loadedCount,
            total: clientInfinite.total,
          } : undefined}
          tableView={tableView}
          listView={(
            <GridListView
              data={cardListRows}
              getRowKey={({ menu }) => String(menu.id)}
              isRowSelected={({ menu }) => grid.selected.includes(menu.id)}
              onRowClick={({ menu }) => grid.toggleSelect(menu.id)}
              renderItem={({ menu, depth }) => (
                <MenuCard
                  menu={menu}
                  depth={depth}
                  actions={getMenuRowActions(menu)}
                />
              )}
            />
          )}
          cardView={(
            <GridCardsView
              data={cardListRows}
              getRowKey={({ menu }) => String(menu.id)}
              isRowSelected={({ menu }) => grid.selected.includes(menu.id)}
              onRowClick={({ menu }) => grid.toggleSelect(menu.id)}
              renderCard={({ menu, depth }) => (
                <MenuCard
                  menu={menu}
                  depth={depth}
                  actions={getMenuRowActions(menu)}
                />
              )}
            />
          )}
        />
      </GridPanel>

      <AlertDialog
        open={grid.deleteIds.length > 0}
        onOpenChange={(open) => !open && grid.clearDeleteRequest()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogPanelTitle icon={Trash2}>
              Remover {grid.deleteIds.length === 1 ? 'item de menu' : `${grid.deleteIds.length} itens de menu`}
            </AlertDialogPanelTitle>
            <AlertDialogDescription>
              Tem certeza? Filhos dos itens selecionados também serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel />
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
