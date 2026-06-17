import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { resolveTenantSlugFromHostname } from '@/lib/tenant-host';
import { buildTenantAuthQuery } from '@/lib/tenant-login-path';
import { authService } from '@/services/auth.service';

export { buildTenantAuthQuery } from '@/lib/tenant-login-path';

export function useTenantAuthContext() {
  const [searchParams] = useSearchParams();
  const hostSlug =
    typeof window !== 'undefined'
      ? resolveTenantSlugFromHostname(window.location.hostname)
      : null;
  const tenantQuery = (
    searchParams.get('tenant')
    ?? searchParams.get('tenant_id')
    ?? hostSlug
    ?? ''
  ).trim();

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
    isCentralHost: result?.is_central_host ?? !hostSlug,
    tenant: result?.tenant ?? null,
    tenantId: result?.tenant?.id ?? (tenantQuery !== '' && !isLoading ? tenantQuery : ''),
    tenantSlug: result?.tenant?.slug ?? tenantQuery,
    tenantQuery,
    hostSlug,
    source: result?.source ?? (hostSlug ? 'subdomain' : null),
  };
}
