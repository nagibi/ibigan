export function buildTenantAuthQuery(slug?: string | null): string {
  const normalized = slug?.trim();

  if (!normalized) {
    return '';
  }

  return `?tenant=${encodeURIComponent(normalized)}`;
}

export function buildTenantLoginPath(
  tenantSlug?: string | null,
  extraParams?: Record<string, string | null | undefined>,
): string {
  const search = new URLSearchParams();
  const normalized = tenantSlug?.trim();

  if (normalized) {
    search.set('tenant', normalized);
  }

  if (extraParams) {
    for (const [key, value] of Object.entries(extraParams)) {
      if (value) {
        search.set(key, value);
      }
    }
  }

  const query = search.toString();

  return query ? `/auth/login?${query}` : '/auth/login';
}

export function resolveTenantSlugForLogin(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('tenant') ?? params.get('tenant_id');
  if (fromQuery?.trim()) {
    return fromQuery.trim();
  }

  const fromStorage = localStorage.getItem('ibigan_tenant_id');
  if (fromStorage?.trim()) {
    return fromStorage.trim();
  }

  return null;
}
