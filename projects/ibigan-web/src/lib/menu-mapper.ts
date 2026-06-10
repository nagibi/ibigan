import { isSaasAdminRoute } from '@/config/routing';
import { type MenuConfig, type MenuItem } from '@/config/types';
import { type ApiMenu } from '@/services/menus.service';
import { resolveMenuIcon } from '@/lib/menu-icons';

function isSuperAdminOnlyMenu(menu: ApiMenu): boolean {
  if (menu.path && isSaasAdminRoute(menu.path)) {
    return true;
  }

  if (!menu.roles?.length) {
    return false;
  }

  return menu.roles.every((role) => role === 'super-admin');
}

export function mapApiMenusToConfig(apiMenus: ApiMenu[]): MenuConfig {
  return apiMenus
    .filter((m) => m.is_active)
    .sort((a, b) => a.order - b.order)
    .map((m): MenuItem => ({
      title: m.title,
      icon: resolveMenuIcon({
        icon: m.icon,
        path: m.path,
        slug: m.slug,
        title: m.title,
      }),
      path: m.path ?? undefined,
      badge: m.badge ?? undefined,
      superAdminOnly: isSuperAdminOnlyMenu(m),
      children: m.children?.length ? mapApiMenusToConfig(m.children) : undefined,
    }));
}
