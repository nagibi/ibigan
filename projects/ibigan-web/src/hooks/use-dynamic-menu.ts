import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { menusService } from '@/services/menus.service';
import { mapApiMenusToConfig } from '@/lib/menu-mapper';
import { filterMenuForUser } from '@/lib/filter-menu-for-user';
import { mergeSaasMenuItems } from '@/lib/merge-saas-menu-items';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { SUPER_ADMIN_ROLE } from '@/config/routing';
import { type MenuConfig } from '@/config/types';
import { useAuthStore } from '@/stores/auth.store';

export function useDynamicMenu(): MenuConfig {
  const tenantId = useAuthStore((state) => state.tenantId);
  const isSuperAdmin = useAuthStore((state) => state.hasRole(SUPER_ADMIN_ROLE));

  const { data } = useQuery({
    queryKey: ['menus', tenantId],
    queryFn: () => menusService.list(),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(tenantId),
  });

  return useMemo(() => {
    const baseMenu = !data?.data.result?.length
      ? MENU_SIDEBAR
      : mergeSaasMenuItems(mapApiMenusToConfig(data.data.result), MENU_SIDEBAR);

    return filterMenuForUser(baseMenu, isSuperAdmin);
  }, [data, isSuperAdmin]);
}
