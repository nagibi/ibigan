import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { authService } from '@/services/auth.service';

export function buildTenantAuthQuery(slug?: string | null): string {
  if (!slug) {
    return '';
  }

  return `?tenant=${encodeURIComponent(slug)}`;
}

export function useTenantAuthContext() {
  const [searchParams] = useSearchParams();
  const tenantQuery = (searchParams.get('tenant') ?? searchParams.get('tenant_id') ?? '').trim();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tenant-auth-context', window.location.hostname, tenantQuery],
    queryFn: () => authService.tenantContext(tenantQuery || undefined),
    staleTime: 5 * 60 * 1000,
  });

  const result = data?.data.result;
  const isResolved = Boolean(result?.resolved);
  const isTenantKnown = isResolved || tenantQuery !== '';

  return {
    isLoading,
    isError,
    isResolved,
    isTenantKnown,
    isCentralHost: result?.is_central_host ?? true,
    tenant: result?.tenant ?? null,
    tenantId: result?.tenant?.id ?? (tenantQuery !== '' && !isLoading ? tenantQuery : ''),
    tenantSlug: result?.tenant?.slug ?? tenantQuery,
    tenantQuery,
    source: result?.source ?? null,
  };
}
