import { isSaasAdminRoute } from '@/config/routing';
import { type MenuConfig, type MenuItem } from '@/config/types';

function isMenuItemVisible(item: MenuItem, isSuperAdmin: boolean): boolean {
  if (item.path && isSaasAdminRoute(item.path) && !isSuperAdmin) {
    return false;
  }

  if (item.superAdminOnly && !isSuperAdmin) {
    return false;
  }

  return true;
}

function sectionHasVisibleItems(menu: MenuConfig, startIndex: number, isSuperAdmin: boolean): boolean {
  for (let index = startIndex + 1; index < menu.length; index += 1) {
    const item = menu[index];
    if (item.heading) {
      break;
    }

    if (isMenuItemVisible(item, isSuperAdmin)) {
      return true;
    }
  }

  return false;
}

/**
 * Remove itens `superAdminOnly` e headings vazios para usuários sem role super-admin.
 */
export function filterMenuForUser(menu: MenuConfig, isSuperAdmin: boolean): MenuConfig {
  const filtered: MenuConfig = [];

  for (let index = 0; index < menu.length; index += 1) {
    const item = menu[index];

    if (item.heading) {
      if (sectionHasVisibleItems(menu, index, isSuperAdmin)) {
        filtered.push(item);
      }
      continue;
    }

    if (!isMenuItemVisible(item, isSuperAdmin)) {
      continue;
    }

    if (item.children?.length) {
      const children = filterMenuForUser(item.children, isSuperAdmin);
      if (children.length === 0) {
        continue;
      }

      filtered.push({ ...item, children });
      continue;
    }

    filtered.push(item);
  }

  return filtered;
}
