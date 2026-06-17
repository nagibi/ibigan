const DEFAULT_DEV_SUFFIXES = ['localhost', 'local', 'test'];

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().split(':')[0]?.trim() ?? '';
}

export function getTenantDomainSuffixes(): string[] {
  const fromEnv = String(import.meta.env.VITE_TENANT_DOMAIN_SUFFIXES ?? '')
    .split(',')
    .map((suffix) => suffix.trim().toLowerCase())
    .filter(Boolean);

  const central = String(import.meta.env.VITE_CENTRAL_DOMAIN ?? '').trim().toLowerCase();

  return [...new Set([
    ...fromEnv,
    ...(central ? [central] : []),
    ...DEFAULT_DEV_SUFFIXES,
  ])];
}

/**
 * Extrai o slug do tenant a partir do hostname (ex.: techsolutions.nagibi.com.br → techsolutions).
 */
export function resolveTenantSlugFromHostname(hostname: string): string | null {
  const host = normalizeHostname(hostname);

  if (!host) {
    return null;
  }

  for (const suffix of getTenantDomainSuffixes()) {
    const needle = `.${suffix}`;

    if (!host.endsWith(needle) || host === suffix) {
      continue;
    }

    const slug = host.slice(0, -needle.length);

    if (slug && !slug.includes('.') && slug !== 'www') {
      return slug;
    }
  }

  return null;
}

export function isTenantSubdomainHost(hostname?: string): boolean {
  const resolvedHost = hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');

  return resolveTenantSlugFromHostname(resolvedHost) !== null;
}
