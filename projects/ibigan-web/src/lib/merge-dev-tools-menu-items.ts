import i18n from '@/i18n/i18next';
import { DEV_TOOLS_URLS } from '@/lib/dev-tools-urls';
import { type MenuConfig, type MenuItem } from '@/config/types';

const DEV_TOOLS_PATHS = new Set<string>(Object.values(DEV_TOOLS_URLS));

const DEV_TOOL_TRANSLATION_BY_PATH: Partial<Record<string, string>> = {
  [DEV_TOOLS_URLS.apiDocs]: 'menu.api_docs',
  [DEV_TOOLS_URLS.horizon]: 'menu.horizon',
  [DEV_TOOLS_URLS.phpMyAdmin]: 'menu.phpmyadmin',
  [DEV_TOOLS_URLS.mailpit]: 'menu.mailpit',
};

function isDevToolsChild(item: MenuItem): boolean {
  return Boolean(item.path && DEV_TOOLS_PATHS.has(item.path));
}

function isDevToolsGroup(item: MenuItem): boolean {
  return Boolean(item.children?.some(isDevToolsChild));
}

function extractDevToolsGroup(staticMenu: MenuConfig): MenuItem | null {
  return staticMenu.find(isDevToolsGroup) ?? null;
}

function localizeDevToolsGroup(group: MenuItem): MenuItem {
  return {
    ...group,
    title: i18n.t('menu.tools'),
    children: group.children?.map((child) => ({
      ...child,
      title: child.path && DEV_TOOL_TRANSLATION_BY_PATH[child.path]
        ? i18n.t(DEV_TOOL_TRANSLATION_BY_PATH[child.path])
        : child.title,
    })),
  };
}

/**
 * Garante o grupo Ferramentas do menu estático quando o seed do tenant ainda não o inclui.
 */
export function mergeDevToolsMenuItems(
  apiMenu: MenuConfig,
  staticMenu: MenuConfig,
): MenuConfig {
  const devTools = extractDevToolsGroup(staticMenu);
  if (!devTools) {
    return apiMenu;
  }

  if (apiMenu.some(isDevToolsGroup)) {
    return apiMenu;
  }

  return [...apiMenu, localizeDevToolsGroup(devTools)];
}
