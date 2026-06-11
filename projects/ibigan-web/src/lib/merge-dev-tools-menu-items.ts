import { type MenuConfig, type MenuItem } from '@/config/types';

function extractDevToolsGroup(staticMenu: MenuConfig): MenuItem | null {
  return staticMenu.find(
    (item) => item.title === 'Ferramentas' && item.children?.length,
  ) ?? null;
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

  const hasDevTools = apiMenu.some((item) => item.title === 'Ferramentas');
  if (hasDevTools) {
    return apiMenu;
  }

  return [...apiMenu, devTools];
}
