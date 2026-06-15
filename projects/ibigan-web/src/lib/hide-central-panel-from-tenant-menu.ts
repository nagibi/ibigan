import { isSaasAdminRoute } from '@/config/routing';
import { type MenuConfig, type MenuItem } from '@/config/types';

function isCentralPanelMenuItem(item: MenuItem): boolean {
  return Boolean(item.path && isSaasAdminRoute(item.path));
}

function sectionHasNonCentralItems(menu: MenuConfig, startIndex: number): boolean {
  for (let index = startIndex + 1; index < menu.length; index += 1) {
    const item = menu[index];
    if (item.heading) {
      break;
    }

    if (item.children?.length) {
      if (hideCentralPanelRoutesFromTenantMenu(item.children).length > 0) {
        return true;
      }
      continue;
    }

    if (!isCentralPanelMenuItem(item)) {
      return true;
    }
  }

  return false;
}

function hideCentralPanelRoutesFromTenantMenu(menu: MenuConfig): MenuConfig {
  const filtered: MenuConfig = [];

  for (let index = 0; index < menu.length; index += 1) {
    const item = menu[index];

    if (item.heading) {
      if (sectionHasNonCentralItems(menu, index)) {
        filtered.push(item);
      }
      continue;
    }

    if (isCentralPanelMenuItem(item)) {
      continue;
    }

    if (item.children?.length) {
      const children = hideCentralPanelRoutesFromTenantMenu(item.children);
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

/**
 * Super-admin da plataforma em contexto de tenant acessa o painel central
 * apenas pelo menu do perfil — remove rotas `/admin/*` da sidebar.
 */
export function applyTenantCentralMenuPolicy(
  menu: MenuConfig,
  canAccessCentralFromTenant: boolean,
): MenuConfig {
  if (!canAccessCentralFromTenant) {
    return menu;
  }

  return hideCentralPanelRoutesFromTenantMenu(menu);
}
