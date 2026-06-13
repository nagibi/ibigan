import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { menusService } from '@/services/menus.service';
import { mapApiMenusToConfig } from '@/lib/menu-mapper';
import { filterMenuForUser } from '@/lib/filter-menu-for-user';
import { filterMenuByPermissions } from '@/lib/filter-menu-by-permissions';
import { mergeAccountMenuItems } from '@/lib/merge-account-menu-items';
import { mergeDevToolsMenuItems } from '@/lib/merge-dev-tools-menu-items';
import { mergeSaasMenuItems } from '@/lib/merge-saas-menu-items';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { SUPER_ADMIN_ROLE } from '@/config/routing';
import { type MenuConfig } from '@/config/types';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';

export function useDynamicMenu(): MenuConfig {
  const { t } = useTranslation();
  const tenantId = useAuthStore((state) => state.tenantId);
  const isTenantSuperAdmin = useAuthStore((state) => state.hasRole(SUPER_ADMIN_ROLE));
  const isCentralSuperAdmin = useCentralAuthStore((state) => state.centralUser?.is_super_admin);
  const isSuperAdmin = Boolean(isCentralSuperAdmin || isTenantSuperAdmin);

  const hasPermission = useAuthStore((state) => state.hasPermission);

  const { data, isSuccess, isPending } = useQuery({
    queryKey: ['menus', 'navigation', tenantId],
    queryFn: () => menusService.navigation(),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(tenantId),
  });

  return useMemo(() => {
    const fallbackMenu = filterMenuByPermissions(
      filterMenuForUser(MENU_SIDEBAR, isSuperAdmin),
      hasPermission,
    );

    if (isPending) {
      return [];
    }

    const apiMenus = isSuccess ? data?.data.result ?? [] : [];

    if (!isSuccess || apiMenus.length === 0) {
      return fallbackMenu;
    }

    const includeDevTools = hasPermission('doc-visualizar');

    const baseMenu = mergeDevToolsMenuItems(
      mergeAccountMenuItems(
        mergeSaasMenuItems(
          mapApiMenusToConfig(apiMenus, (key, fallback) => t(key, fallback)),
          MENU_SIDEBAR,
        ),
        MENU_SIDEBAR,
      ),
      MENU_SIDEBAR,
      includeDevTools,
    );

    return filterMenuForUser(baseMenu, isSuperAdmin);
  }, [data, hasPermission, isPending, isSuccess, isSuperAdmin, t]);
}
