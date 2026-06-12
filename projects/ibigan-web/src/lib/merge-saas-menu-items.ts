import { isSaasAdminRoute } from '@/config/routing';
import { type MenuConfig, type MenuItem } from '@/config/types';

export function collectMenuPaths(menu: MenuConfig): Set<string> {
  const paths = new Set<string>();

  const walk = (items: MenuConfig): void => {
    for (const item of items) {
      if (item.path) {
        paths.add(item.path);
      }

      if (item.children?.length) {
        walk(item.children);
      }
    }
  };

  walk(menu);

  return paths;
}

function isSaasMenuItem(item: MenuItem): boolean {
  return Boolean(
    item.superAdminOnly
    || (item.path && isSaasAdminRoute(item.path)),
  );
}

/**
 * Extrai headings + itens SaaS (`superAdminOnly` ou path `/admin/*`) do menu estático.
 */
export function extractSaasSections(staticMenu: MenuConfig): MenuConfig {
  const sections: MenuConfig = [];

  for (let index = 0; index < staticMenu.length; index += 1) {
    const item = staticMenu[index];

    if (!item.heading) {
      continue;
    }

    const sectionItems: MenuConfig = [];
    let cursor = index + 1;

    while (cursor < staticMenu.length && !staticMenu[cursor].heading) {
      const candidate = staticMenu[cursor];

      if (isSaasMenuItem(candidate)) {
        sectionItems.push(candidate);
      }

      cursor += 1;
    }

    if (sectionItems.length > 0) {
      sections.push(item, ...sectionItems);
    }
  }

  return sections;
}

/**
 * Garante itens SaaS do menu estático quando o seed do tenant ainda não os inclui.
 */
export function mergeSaasMenuItems(apiMenu: MenuConfig, staticMenu: MenuConfig): MenuConfig {
  const paths = collectMenuPaths(apiMenu);
  const hasSaasRoute = [...paths].some((path) => isSaasAdminRoute(path));

  if (hasSaasRoute) {
    return apiMenu;
  }

  const saasSections = extractSaasSections(staticMenu);

  if (saasSections.length === 0) {
    return apiMenu;
  }

  return [...apiMenu, ...saasSections];
}
