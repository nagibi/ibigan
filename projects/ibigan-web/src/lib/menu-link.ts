import { type MenuItem } from '@/config/types';

export type MenuLinkTarget = '_self' | '_blank';

export function isExternalMenuPath(path?: string): boolean {
  if (!path) return false;
  return /^https?:\/\//i.test(path);
}

export function resolveMenuLinkTarget(
  path?: string,
  target?: MenuLinkTarget,
): MenuLinkTarget {
  if (target === '_blank' || isExternalMenuPath(path)) {
    return '_blank';
  }

  return target ?? '_self';
}

export function getMenuItemHref(item: Pick<MenuItem, 'path'>): string | undefined {
  return item.path;
}
