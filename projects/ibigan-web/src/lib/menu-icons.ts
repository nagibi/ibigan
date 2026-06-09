import * as Icons from 'lucide-react';
import { LayoutGrid, type LucideIcon } from 'lucide-react';
import { MENU_SIDEBAR } from '@/config/menu.config';
import type { MenuConfig } from '@/config/types';

type IconLookup = {
  byPath: Map<string, LucideIcon>;
  byTitle: Map<string, LucideIcon>;
  bySlug: Map<string, LucideIcon>;
};

function toPascalCase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(/[-_\s.]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

function buildLookup(items: MenuConfig, lookup: IconLookup) {
  for (const item of items) {
    if (item.heading || !item.icon) continue;

    if (item.path) {
      lookup.byPath.set(item.path, item.icon);
      const slug = item.path.replace(/^\//, '').split('/')[0];
      if (slug && !lookup.bySlug.has(slug)) {
        lookup.bySlug.set(slug, item.icon);
      }
    }

    if (item.title) {
      lookup.byTitle.set(item.title, item.icon);
    }

    if (item.children) {
      buildLookup(item.children, lookup);
    }
  }
}

const lookup: IconLookup = {
  byPath: new Map(),
  byTitle: new Map(),
  bySlug: new Map(),
};

buildLookup(MENU_SIDEBAR, lookup);

// Grupos vindos da API (sem heading, como accordion pai)
lookup.byTitle.set('Gestão', Icons.Users);
lookup.byTitle.set('Configurações', Icons.Settings);
lookup.bySlug.set('gestao', Icons.Users);
lookup.bySlug.set('configuracoes', Icons.Settings);

function resolveFromLucideName(name: string): LucideIcon | null {
  const candidates = [
    name,
    name.charAt(0).toUpperCase() + name.slice(1),
    toPascalCase(name),
  ];

  for (const candidate of [...new Set(candidates)]) {
    const icon = (Icons as Record<string, unknown>)[candidate];
    if (typeof icon === 'function') {
      return icon as LucideIcon;
    }
  }

  return null;
}

export function resolveMenuIcon(options: {
  icon?: string | null;
  path?: string | null;
  slug?: string | null;
  title?: string | null;
}): LucideIcon {
  const { icon, path, slug, title } = options;

  if (icon?.trim()) {
    const resolved = resolveFromLucideName(icon.trim());
    if (resolved) return resolved;
  }

  if (path) {
    const exact = lookup.byPath.get(path);
    if (exact) return exact;
  }

  if (slug) {
    const bySlug = lookup.bySlug.get(slug.toLowerCase());
    if (bySlug) return bySlug;

    const fromName = resolveFromLucideName(slug);
    if (fromName) return fromName;
  }

  if (title) {
    const byTitle = lookup.byTitle.get(title);
    if (byTitle) return byTitle;
  }

  if (path) {
    const segment = path.replace(/^\//, '').split('/')[0];
    const bySegment = lookup.bySlug.get(segment);
    if (bySegment) return bySegment;
  }

  return LayoutGrid;
}
