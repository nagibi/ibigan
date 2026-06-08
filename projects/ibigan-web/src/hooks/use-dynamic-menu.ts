import { useQuery } from '@tanstack/react-query';
import { menusService } from '@/services/menus.service';
import { mapApiMenusToConfig } from '@/lib/menu-mapper';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { type MenuConfig } from '@/config/types';

export function useDynamicMenu(): MenuConfig {
  const { data } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menusService.list(),
    staleTime: 5 * 60 * 1000,
  });

  if (!data?.data.result?.length) {
    return MENU_SIDEBAR;
  }

  return mapApiMenusToConfig(data.data.result);
}
