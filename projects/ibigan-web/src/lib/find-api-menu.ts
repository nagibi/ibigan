import { type ApiMenu } from '@/services/menus.service';

export function findApiMenuByPath(menus: ApiMenu[], path: string): ApiMenu | undefined {
  for (const menu of menus) {
    if (menu.path === path) {
      return menu;
    }

    const found = findApiMenuByPath(menu.children ?? [], path);
    if (found) {
      return found;
    }
  }

  return undefined;
}
