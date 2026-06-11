import { User } from 'lucide-react';
import { type MenuConfig, type MenuItem } from '@/config/types';
import { collectMenuPaths } from '@/lib/merge-saas-menu-items';

const ACCOUNT_PATHS = new Set(['/profile', '/notifications']);

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

function extractAccountItems(staticMenu: MenuConfig): MenuConfig {
  const contaGroup = staticMenu.find(
    (item) => item.title === 'Conta' && item.children?.length,
  );

  if (contaGroup?.children) {
    return contaGroup.children;
  }

  return extractSectionByHeading(staticMenu, 'CONTA');
}

function findAccountMenuIndex(menu: MenuConfig): number {
  return menu.findIndex((item) => {
    if (!item.children?.length) {
      return false;
    }

    return item.title === 'Conta'
      || item.children.some((child) => child.path && ACCOUNT_PATHS.has(child.path));
  });
}

function createContaGroup(children: MenuConfig): MenuItem {
  return {
    title: 'Conta',
    icon: User,
    children,
  };
}

function mergeIntoAccountGroup(menu: MenuConfig, toAdd: MenuConfig): MenuConfig {
  if (toAdd.length === 0) {
    return menu;
  }

  const accountIndex = findAccountMenuIndex(menu);

  if (accountIndex >= 0) {
    const accountGroup = menu[accountIndex];
    const existingChildren = accountGroup.children ?? [];
    const existingPaths = new Set(
      existingChildren.map((child) => child.path).filter((path): path is string => Boolean(path)),
    );
    const newChildren = toAdd.filter((item) => item.path && !existingPaths.has(item.path));

    if (newChildren.length === 0) {
      return menu;
    }

    const nextMenu = [...menu];
    nextMenu[accountIndex] = {
      ...accountGroup,
      icon: accountGroup.icon ?? User,
      children: [...existingChildren, ...newChildren],
    };

    return nextMenu;
  }

  return [...menu, createContaGroup(toAdd)];
}

/**
 * Move itens de conta que estão na raiz do menu para dentro do grupo Conta.
 */
function relocateRootAccountItems(menu: MenuConfig): MenuConfig {
  const orphans: MenuConfig = [];
  const withoutOrphans: MenuConfig = [];

  for (const item of menu) {
    if (item.path && ACCOUNT_PATHS.has(item.path)) {
      orphans.push(item);
      continue;
    }

    withoutOrphans.push(item);
  }

  if (orphans.length === 0) {
    return menu;
  }

  return mergeIntoAccountGroup(withoutOrphans, orphans);
}

/**
 * Garante itens da seção Conta do menu estático quando o seed do tenant ainda não os inclui.
 */
export function mergeAccountMenuItems(apiMenu: MenuConfig, staticMenu: MenuConfig): MenuConfig {
  const apiPaths = collectMenuPaths(apiMenu);
  const accountItems = extractAccountItems(staticMenu);
  const missingItems = accountItems.filter((item) => item.path && !apiPaths.has(item.path));

  const withMissing = missingItems.length > 0
    ? mergeIntoAccountGroup(apiMenu, missingItems)
    : apiMenu;

  return relocateRootAccountItems(withMissing);
}
