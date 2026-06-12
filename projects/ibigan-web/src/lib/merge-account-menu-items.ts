import { User } from 'lucide-react';
import i18n from '@/i18n/i18next';
import { type MenuConfig, type MenuItem } from '@/config/types';
import { collectMenuPaths } from '@/lib/merge-saas-menu-items';

const ACCOUNT_PATHS = new Set(['/profile', '/notifications']);

const ACCOUNT_TRANSLATION_BY_PATH: Record<string, string> = {
  '/profile': 'menu.profile',
  '/notifications': 'menu.notifications',
};

function isAccountChild(item: MenuItem): boolean {
  return Boolean(item.path && ACCOUNT_PATHS.has(item.path));
}

function isAccountGroup(item: MenuItem): boolean {
  return Boolean(item.children?.some(isAccountChild));
}

function localizeAccountItems(items: MenuConfig): MenuConfig {
  return items.map((item) => ({
    ...item,
    title: item.path && ACCOUNT_TRANSLATION_BY_PATH[item.path]
      ? i18n.t(ACCOUNT_TRANSLATION_BY_PATH[item.path])
      : item.title,
  }));
}

function extractAccountItems(staticMenu: MenuConfig): MenuConfig {
  const accountGroup = staticMenu.find(isAccountGroup);

  return accountGroup?.children ?? [];
}

function findAccountMenuIndex(menu: MenuConfig): number {
  return menu.findIndex(isAccountGroup);
}

function createAccountGroup(children: MenuConfig): MenuItem {
  return {
    title: i18n.t('menu.account'),
    icon: User,
    children,
  };
}

function mergeIntoAccountGroup(menu: MenuConfig, toAdd: MenuConfig): MenuConfig {
  if (toAdd.length === 0) {
    return menu;
  }

  const localizedToAdd = localizeAccountItems(toAdd);
  const accountIndex = findAccountMenuIndex(menu);

  if (accountIndex >= 0) {
    const accountGroup = menu[accountIndex];
    const existingChildren = accountGroup.children ?? [];
    const existingPaths = new Set(
      existingChildren.map((child) => child.path).filter((path): path is string => Boolean(path)),
    );
    const newChildren = localizedToAdd.filter((item) => item.path && !existingPaths.has(item.path));

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

  return [...menu, createAccountGroup(localizedToAdd)];
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
