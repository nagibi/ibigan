import type { MenuConfig } from '@/config/types';

export function menuPathMatches(pathname: string, path: string): boolean {
  if (!path) {
    return false;
  }

  if (path === '/') {
    return pathname === '/';
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

export function findActiveMenuPath(pathname: string, items: MenuConfig): string | null {
  let best: string | null = null;

  const walk = (menuItems: MenuConfig) => {
    for (const item of menuItems) {
      if (item.path && menuPathMatches(pathname, item.path)) {
        if (!best || item.path.length > best.length) {
          best = item.path;
        }
      }

      if (item.children?.length) {
        walk(item.children);
      }
    }
  };

  walk(items);
  return best;
}

export function isMenuPathActive(pathname: string, path: string | undefined, items: MenuConfig): boolean {
  if (!path) {
    return false;
  }

  return findActiveMenuPath(pathname, items) === path;
}

export function menuGroupContainsActivePath(
  pathname: string,
  allItems: MenuConfig,
  groupItems: MenuConfig,
): boolean {
  const activePath = findActiveMenuPath(pathname, allItems);

  if (!activePath) {
    return false;
  }

  const paths: string[] = [];

  const walk = (menuItems: MenuConfig) => {
    for (const item of menuItems) {
      if (item.path) {
        paths.push(item.path);
      }

      if (item.children?.length) {
        walk(item.children);
      }
    }
  };

  walk(groupItems);
  return paths.includes(activePath);
}
