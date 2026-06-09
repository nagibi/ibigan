import { type MenuConfig, type MenuItem } from '@/config/types';
import { type ApiMenu } from '@/services/menus.service';
import { resolveMenuIcon } from '@/lib/menu-icons';

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
      children: m.children?.length ? mapApiMenusToConfig(m.children) : undefined,
    }));
}
