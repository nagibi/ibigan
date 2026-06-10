import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { findApiMenuByPath } from '@/lib/find-api-menu';
import { menusService, type ApiMenu } from '@/services/menus.service';
import { useAuthStore } from '@/stores/auth.store';

export function useApiMenuByPath(path: string): ApiMenu | undefined {
  const tenantId = useAuthStore((state) => state.tenantId);

  const { data } = useQuery({
    queryKey: ['menus', tenantId],
    queryFn: () => menusService.list(),
    staleTime: 5 * 60 * 1000,
    enabled: Boolean(tenantId),
  });

  const menus = data?.data.result ?? [];

  return useMemo(() => findApiMenuByPath(menus, path), [menus, path]);
}
