import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
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

function collectMenuIds(menus: ApiMenu[]): number[] {
  return menus.flatMap((menu) => [
    menu.id,
    ...collectMenuIds(menu.children ?? []),
  ]);
}

function MenuRow({
  menu,
  depth = 0,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  onToggleActive,
  rowStatusId,
}: {
  menu: ApiMenu;
  depth?: number;
  selected: number[];
  onToggleSelect: (id: number) => void;
  onEdit: (menu: ApiMenu) => void;
  onDelete: (id: number) => void;
  onToggleActive: (menu: ApiMenu, active: boolean) => void;
  rowStatusId: number | null;
}) {
  const Icon = resolveMenuIcon({
    icon: menu.icon,
    path: menu.path,
    slug: menu.slug,
    title: menu.title,
  });

  return (
    <>
      <TableRow
        data-state={selected.includes(menu.id) ? 'selected' : undefined}
        className={getGridRowClassName({
          selected: selected.includes(menu.id),
          interactive: true,
        })}
        onClick={() => onToggleSelect(menu.id)}
      >
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
        <TableCell onClick={(event) => event.stopPropagation()}>
          <Switch
            size="sm"
            checked={menu.is_active}
            disabled={rowStatusId === menu.id}
            onCheckedChange={(checked) => onToggleActive(menu, checked)}
          />
        </TableCell>
        <TableCell>{menu.order}</TableCell>
      </TableRow>
      {menu.children?.map((child) => (
        <MenuRow
          key={child.id}
          menu={child}
          depth={depth + 1}
          selected={selected}
          onToggleSelect={onToggleSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          rowStatusId={rowStatusId}
        />
      ))}
    </>
  );
}

export function MenusPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [rowStatusId, setRowStatusId] = useState<number | null>(null);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menusService.list(),
  });

  const menus = data?.data.result ?? [];

  const filteredMenus = useMemo(
    () => filterMenuTree(menus, grid.debouncedSearch),
    [menus, grid.debouncedSearch],
  );

  const visibleIds = useMemo(() => collectMenuIds(filteredMenus), [filteredMenus]);

  const load = useCallback(async () => {
    await refetch();
  }, [refetch]);

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
        isRefreshing={isLoading || isFetching}
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
      load,
      navigate,
    ],
  );

  usePageToolbar({
    title: 'Menus',
    description: 'Gerencie a navegação do sistema.',
    actions: toolbarActions,
  });

  const allVisibleSelected = visibleIds.length > 0
    && visibleIds.every((id) => grid.selected.includes(id));

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
            isRefreshing={isLoading || isFetching}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder="Buscar por título ou caminho..."
          />
        )}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] text-center">#</TableHead>
              <TableHead className="w-[70px]">Id</TableHead>
              <TableHead className="w-[72px] text-center">Ações</TableHead>
              <TableHead>Título</TableHead>
              <TableHead>Caminho</TableHead>
              <TableHead>Ícone</TableHead>
              <TableHead>Badge</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Ordem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filteredMenus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  {grid.debouncedSearch.trim()
                    ? 'Nenhum menu encontrado para a busca.'
                    : 'Nenhum menu cadastrado.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMenus.map((menu) => (
                <MenuRow
                  key={menu.id}
                  menu={menu}
                  selected={grid.selected}
                  onToggleSelect={grid.toggleSelect}
                  onEdit={handleEdit}
                  onDelete={(id) => grid.requestDelete([id])}
                  onToggleActive={(m, active) => void handleRowStatusChange(m, active)}
                  rowStatusId={rowStatusId}
                />
              ))
            )}
          </TableBody>
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
