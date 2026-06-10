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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronRight, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useAuthStore } from '@/stores/auth.store';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
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
import { GridPanel } from '@/components/grid/grid-panel';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { getGridRowClassName } from '@/components/grid/grid-table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { cn } from '@/lib/utils';

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

function SortableMenuRow({
  menu,
  depth,
  selected,
  sortable,
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
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = resolveMenuIcon({
    icon: menu.icon,
    path: menu.path,
    slug: menu.slug,
    title: menu.title,
  });

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
      <TableCell
        className="w-[36px] text-center"
        onClick={(event) => event.stopPropagation()}
      >
        {sortable ? (
          <button
            type="button"
            className="inline-flex cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
            aria-label="Reordenar menu"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        ) : (
          <span className="inline-block size-4" />
        )}
      </TableCell>
      <TableCell className="w-[40px] text-center" onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-center">
          <Checkbox
            checked={selected.includes(menu.id)}
            onCheckedChange={() => onToggleSelect(menu.id)}
          />
        </div>
      </TableCell>
      <TableCell className="w-[70px] text-sm text-muted-foreground">{menu.id}</TableCell>
      <TableCell className="w-[72px] text-center" onClick={(event) => event.stopPropagation()}>
        <div className="flex justify-center">
          <GridRowActions
            actions={[
              { label: 'Editar', icon: Pencil, onClick: () => onEdit(menu) },
              {
                label: 'Remover',
                icon: Trash2,
                tone: 'destructive',
                onClick: () => onDelete(menu.id),
              },
            ]}
          />
        </div>
      </TableCell>
      <TableCell className="w-[80px]" onClick={(event) => event.stopPropagation()}>
        <Switch
          size="sm"
          checked={menu.is_active}
          disabled={rowStatusId === menu.id}
          onCheckedChange={(checked) => onToggleActive(menu, checked)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
          {depth > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          <span className="font-medium">{menu.title}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{menu.path ?? '—'}</TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">{menu.icon ?? '—'}</Badge>
      </TableCell>
      <TableCell>
        {menu.badge ? (
          <Badge variant="primary" appearance="light" size="sm">{menu.badge}</Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>{menu.order}</TableCell>
      <TableCell className="min-w-[150px] whitespace-nowrap text-sm text-muted-foreground">
        {formatMenuDate(menu.created_at)}
      </TableCell>
      <TableCell className="min-w-[150px] whitespace-nowrap text-sm text-muted-foreground">
        {formatMenuDate(menu.updated_at)}
      </TableCell>
    </TableRow>
  );
}

export function MenusPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.tenantId);
  const { showSuccess, showToggleActive, showError } = useApiToolbarAlert();

  const grid = useGrid({
    onActivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => menusService.toggleActive(id, true)));
        showToggleActive(true, TOGGLE_ACTIVE_LABELS.menu, ids.length);
        await queryClient.invalidateQueries({ queryKey: ['menus'] });
      } catch (error) {
        showError('Erro ao ativar menu(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
    onDeactivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => menusService.toggleActive(id, false)));
        showToggleActive(false, TOGGLE_ACTIVE_LABELS.menu, ids.length);
        await queryClient.invalidateQueries({ queryKey: ['menus'] });
      } catch (error) {
        showError('Erro ao inativar menu(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [rowStatusId, setRowStatusId] = useState<number | null>(null);
  const [menuTree, setMenuTree] = useState<ApiMenu[]>([]);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['menus', tenantId],
    queryFn: () => menusService.list(),
    enabled: Boolean(tenantId),
  });

  const menus = data?.data.result ?? [];

  useEffect(() => {
    setMenuTree(menus);
  }, [menus]);

  const canReorder = !grid.debouncedSearch.trim() && !isLoading && !isReordering;

  const displayMenus = useMemo(
    () => (grid.debouncedSearch.trim() ? filterMenuTree(menuTree, grid.debouncedSearch) : menuTree),
    [menuTree, grid.debouncedSearch],
  );

  const flatRows = useMemo(() => flattenMenuTree(displayMenus), [displayMenus]);
  const sortableIds = useMemo(() => flatRows.map((row) => row.menu.id), [flatRows]);
  const visibleIds = useMemo(() => collectMenuIds(displayMenus), [displayMenus]);

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
        hasSelection={grid.hasSelection}
        singleSelection={grid.singleSelection}
        isTogglingActive={grid.isTogglingActive}
        onRefresh={() => void load()}
        isRefreshing={isLoading || isFetching || isReordering}
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
      isFetching,
      isLoading,
      isReordering,
      load,
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

  const tableBody = (
    <>
      {isLoading ? (
        <TableRow>
          <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
            Carregando...
          </TableCell>
        </TableRow>
      ) : flatRows.length === 0 ? (
        <TableRow>
          <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
            {grid.debouncedSearch.trim()
              ? 'Nenhum menu encontrado para a busca.'
              : 'Nenhum menu cadastrado.'}
          </TableCell>
        </TableRow>
      ) : (
        flatRows.map(({ menu, depth }) => (
          <SortableMenuRow
            key={menu.id}
            menu={menu}
            depth={depth}
            sortable={canReorder}
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

  return (
    <PageBody>
      <GridPanel
        toolbar={(
          <GridPanelToolbar
            onSelectAll={() => grid.toggleSelectAll(visibleIds)}
            isAllSelected={allVisibleSelected}
            selectedCount={grid.selected.length}
            onClearSelection={grid.clearSelection}
            onRefresh={load}
            isRefreshing={isLoading || isFetching || isReordering}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder="Buscar por título ou caminho..."
          />
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[36px]" />
              <TableHead className="w-[40px] text-center">#</TableHead>
              <TableHead className="w-[70px]">Id</TableHead>
              <TableHead className="w-[72px] text-center">Ações</TableHead>
              <TableHead className="w-[80px]">Ativo</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Caminho</TableHead>
              <TableHead>Ícone</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead>Data de cadastro</TableHead>
              <TableHead>Atualização</TableHead>
            </TableRow>
          </TableHeader>
          {canReorder ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
                <TableBody>{tableBody}</TableBody>
              </SortableContext>
            </DndContext>
          ) : (
            <TableBody>{tableBody}</TableBody>
          )}
        </Table>
      </GridPanel>

      <AlertDialog
        open={grid.deleteIds.length > 0}
        onOpenChange={(open) => !open && grid.clearDeleteRequest()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remover {grid.deleteIds.length === 1 ? 'item de menu' : `${grid.deleteIds.length} itens de menu`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Filhos dos itens selecionados também serão removidos.
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
