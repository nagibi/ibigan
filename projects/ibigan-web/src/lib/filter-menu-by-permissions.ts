import { type MenuConfig, type MenuItem } from '@/config/types';

const PATH_PERMISSIONS: Record<string, string> = {
  '/users': 'usuario-visualizar',
  '/user-approvals': 'aprovacao-visualizar',
  '/invites': 'convite-visualizar',
  '/campaigns': 'campanha-visualizar',
  '/message-templates': 'template-visualizar',
  '/reports': 'relatorio-visualizar',
  '/reports/executions': 'relatorio-visualizar',
  '/menus': 'menu-visualizar',
  '/roles': 'permissao-visualizar',
  '/permissions': 'permissao-visualizar',
  '/webhooks': 'webhook-visualizar',
  '/activity-logs': 'log-visualizar',
  '/settings/translations': 'configuracao-gerenciar',
};

function pathPermission(path: string | undefined): string | undefined {
  if (!path) return undefined;

  if (PATH_PERMISSIONS[path]) {
    return PATH_PERMISSIONS[path];
  }

  for (const [prefix, permission] of Object.entries(PATH_PERMISSIONS)) {
    if (path.startsWith(`${prefix}/`)) {
      return permission;
    }
  }

  return undefined;
}

function isItemVisible(item: MenuItem, hasPermission: (permission: string) => boolean): boolean {
  const required = pathPermission(item.path);

  if (required && !hasPermission(required)) {
    return false;
  }

  if (item.children?.length) {
    return item.children.some((child) => isItemVisible(child, hasPermission));
  }

  return true;
}

function filterItems(
  items: MenuConfig,
  hasPermission: (permission: string) => boolean,
): MenuConfig {
  const filtered: MenuConfig = [];

  for (const item of items) {
    if (item.heading) {
      filtered.push(item);
      continue;
    }

    if (item.children?.length) {
      const children = filterItems(item.children, hasPermission);
      if (children.length === 0) {
        continue;
      }

      filtered.push({ ...item, children });
      continue;
    }

    if (isItemVisible(item, hasPermission)) {
      filtered.push(item);
    }
  }

  return filtered.filter((item, index, menu) => {
    if (!item.heading) {
      return true;
    }

    const next = menu[index + 1];
    return Boolean(next && !next.heading);
  });
}

export function filterMenuByPermissions(
  menu: MenuConfig,
  hasPermission: (permission: string) => boolean,
): MenuConfig {
  return filterItems(menu, hasPermission);
}
