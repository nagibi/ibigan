import { arrayMove } from '@dnd-kit/sortable';
import { type ApiMenu } from '@/services/menus.service';

export interface MenuReorderItem {
  id: number;
  order: number;
  parent_id: number | null;
}

export interface FlatMenuRow {
  menu: ApiMenu;
  depth: number;
}

export function flattenMenuTree(menus: ApiMenu[], depth = 0): FlatMenuRow[] {
  return menus.flatMap((menu) => [
    { menu, depth },
    ...flattenMenuTree(menu.children ?? [], depth + 1),
  ]);
}

export function findParentId(
  menus: ApiMenu[],
  id: number,
  parentId: number | null = null,
): number | null | undefined {
  for (const menu of menus) {
    if (menu.id === id) {
      return parentId;
    }

    const found = findParentId(menu.children ?? [], id, menu.id);
    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
}

export function reorderSiblingMenus(
  menus: ApiMenu[],
  activeId: number,
  overId: number,
): ApiMenu[] | null {
  if (activeId === overId) {
    return null;
  }

  const parentId = findParentId(menus, activeId);
  const overParentId = findParentId(menus, overId);

  if (parentId === undefined || overParentId === undefined || parentId !== overParentId) {
    return null;
  }

  const reorderAtParent = (nodes: ApiMenu[], currentParent: number | null): ApiMenu[] => {
    if (currentParent === parentId) {
      const activeIndex = nodes.findIndex((node) => node.id === activeId);
      const overIndex = nodes.findIndex((node) => node.id === overId);

      if (activeIndex < 0 || overIndex < 0) {
        return nodes;
      }

      return arrayMove(nodes, activeIndex, overIndex).map((node, order) => ({
        ...node,
        order,
      }));
    }

    return nodes.map((node) => ({
      ...node,
      children: reorderAtParent(node.children ?? [], node.id),
    }));
  };

  return reorderAtParent(menus, null);
}

export function buildMenuReorderItems(
  menus: ApiMenu[],
  parentId: number | null = null,
): MenuReorderItem[] {
  return menus.flatMap((menu, order) => [
    { id: menu.id, order, parent_id: parentId },
    ...buildMenuReorderItems(menu.children ?? [], menu.id),
  ]);
}
