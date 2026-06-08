import * as Icons from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { type MenuConfig, type MenuItem } from '@/config/types';
import { type ApiMenu } from '@/services/menus.service';

function resolveIcon(iconName: string | null): LucideIcon | undefined {
  if (!iconName) return undefined;
  const icon = (Icons as Record<string, unknown>)[iconName];
  return typeof icon === 'function' ? (icon as LucideIcon) : undefined;
}

export function mapApiMenusToConfig(apiMenus: ApiMenu[]): MenuConfig {
  return apiMenus
    .filter((m) => m.is_active)
    .sort((a, b) => a.order - b.order)
    .map((m): MenuItem => ({
      title: m.title,
      icon: resolveIcon(m.icon),
      path: m.path ?? undefined,
      children: m.children?.length ? mapApiMenusToConfig(m.children) : undefined,
    }));
}
