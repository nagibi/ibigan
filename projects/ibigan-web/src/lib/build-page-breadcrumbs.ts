import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { MenuItem } from '@/config/types';

export type PageBreadcrumbItem = {
  title: ReactNode;
  path?: string;
  icon?: LucideIcon;
};

function toBreadcrumbLabel(value: ReactNode): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (typeof value === 'number') return String(value);
  return null;
}

export function buildPageBreadcrumbs({
  menuItems,
  pathname,
  pageTitle,
  customItems,
}: {
  menuItems: MenuItem[];
  pathname: string;
  pageTitle?: ReactNode;
  customItems?: PageBreadcrumbItem[];
}): PageBreadcrumbItem[] {
  if (customItems?.length) {
    return customItems;
  }

  const trail: PageBreadcrumbItem[] = menuItems
    .filter((item) => !item.heading && item.title)
    .map((item) => ({
      title: item.title!,
      path: item.path,
      icon: item.icon,
    }));

  const lastMenuPath = trail.at(-1)?.path;
  const pageLabel = pageTitle ? toBreadcrumbLabel(pageTitle) : null;
  const isSubRoute = Boolean(
    lastMenuPath &&
    pageLabel &&
    pathname !== lastMenuPath &&
    pathname.startsWith(`${lastMenuPath}/`),
  );

  if (isSubRoute) {
    trail.push({ title: pageLabel! });
    return trail;
  }

  if (trail.length === 0 && pageLabel) {
    return [{ title: pageLabel }];
  }

  return trail;
}
