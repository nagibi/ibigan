const TENANT_SLUG_COLOR_PALETTE = [
  { bg: 'bg-blue-100 dark:bg-blue-500/20', icon: 'text-blue-700 dark:text-blue-400' },
  { bg: 'bg-emerald-100 dark:bg-emerald-500/20', icon: 'text-emerald-700 dark:text-emerald-400' },
  { bg: 'bg-violet-100 dark:bg-violet-500/20', icon: 'text-violet-700 dark:text-violet-400' },
  { bg: 'bg-amber-100 dark:bg-amber-500/20', icon: 'text-amber-800 dark:text-amber-400' },
  { bg: 'bg-rose-100 dark:bg-rose-500/20', icon: 'text-rose-700 dark:text-rose-400' },
  { bg: 'bg-cyan-100 dark:bg-cyan-500/20', icon: 'text-cyan-700 dark:text-cyan-400' },
  { bg: 'bg-orange-100 dark:bg-orange-500/20', icon: 'text-orange-700 dark:text-orange-400' },
  { bg: 'bg-indigo-100 dark:bg-indigo-500/20', icon: 'text-indigo-700 dark:text-indigo-400' },
  { bg: 'bg-pink-100 dark:bg-pink-500/20', icon: 'text-pink-700 dark:text-pink-400' },
  { bg: 'bg-teal-100 dark:bg-teal-500/20', icon: 'text-teal-700 dark:text-teal-400' },
  { bg: 'bg-fuchsia-100 dark:bg-fuchsia-500/20', icon: 'text-fuchsia-700 dark:text-fuchsia-400' },
  { bg: 'bg-lime-100 dark:bg-lime-500/20', icon: 'text-lime-800 dark:text-lime-400' },
] as const;

export type TenantSlugColors = (typeof TENANT_SLUG_COLOR_PALETTE)[number];

function hashSlug(slug: string): number {
  let hash = 0;

  for (let index = 0; index < slug.length; index++) {
    hash = (hash * 31 + slug.charCodeAt(index)) >>> 0;
  }

  return hash;
}

/** Cor de fundo e ícone estáveis para cada slug de empresa. */
export function getTenantSlugColors(slug: string): TenantSlugColors {
  const normalized = slug.trim().toLowerCase() || 'default';
  const paletteIndex = hashSlug(normalized) % TENANT_SLUG_COLOR_PALETTE.length;

  return TENANT_SLUG_COLOR_PALETTE[paletteIndex];
}
