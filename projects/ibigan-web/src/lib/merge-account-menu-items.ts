import { type MenuConfig } from '@/config/types';
import { collectMenuPaths } from '@/lib/merge-saas-menu-items';

function extractSectionByHeading(menu: MenuConfig, heading: string): MenuConfig {
  const section: MenuConfig = [];

  for (let index = 0; index < menu.length; index += 1) {
    if (menu[index].heading !== heading) {
      continue;
    }

    for (let cursor = index + 1; cursor < menu.length && !menu[cursor].heading; cursor += 1) {
      section.push(menu[cursor]);
    }

    break;
  }

  return section;
}

function findAccountMenuIndex(menu: MenuConfig): number {
  return menu.findIndex((item) => {
    if (!item.children?.length) {
      return false;
    }

    return item.title === 'Conta'
      || item.children.some((child) => child.path === '/profile');
  });
}

/**
 * Garante itens da seção Conta do menu estático quando o seed do tenant ainda não os inclui.
 */
export function mergeAccountMenuItems(apiMenu: MenuConfig, staticMenu: MenuConfig): MenuConfig {
  const apiPaths = collectMenuPaths(apiMenu);
  const accountItems = extractSectionByHeading(staticMenu, 'CONTA');
  const missingItems = accountItems.filter((item) => item.path && !apiPaths.has(item.path));

  if (missingItems.length === 0) {
    return apiMenu;
  }

  const accountIndex = findAccountMenuIndex(apiMenu);

  if (accountIndex >= 0) {
    const accountGroup = apiMenu[accountIndex];
    const existingChildren = accountGroup.children ?? [];
    const existingPaths = new Set(
      existingChildren.map((child) => child.path).filter((path): path is string => Boolean(path)),
    );
    const toAdd = missingItems.filter((item) => item.path && !existingPaths.has(item.path));

    if (toAdd.length === 0) {
      return apiMenu;
    }

    const nextMenu = [...apiMenu];
    nextMenu[accountIndex] = {
      ...accountGroup,
      children: [...existingChildren, ...toAdd],
    };

    return nextMenu;
  }

  const contaHeading = staticMenu.find((item) => item.heading === 'CONTA');

  return [...apiMenu, ...(contaHeading ? [contaHeading] : []), ...missingItems];
}

function isAccountMenuGroup(item: MenuConfig[number]): boolean {
  return Boolean(
    !item.path
    && !item.heading
    && item.children?.length
    && (
      item.title === 'Conta'
      || item.children.some((child) => child.path === '/profile')
    ),
  );
}

/** Expõe itens de Conta como seção plana (heading + links), igual ao menu estático. */
export function flattenAccountMenuGroups(menu: MenuConfig): MenuConfig {
  const flat: MenuConfig = [];

  for (const item of menu) {
    if (isAccountMenuGroup(item)) {
      flat.push({ heading: 'CONTA' });
      flat.push(...(item.children ?? []));
      continue;
    }

    flat.push(item);
  }

  return flat;
}
