import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resetEcho } from '@/lib/echo';
import { adminTenantsService, type AdminTenant } from '@/services/admin-tenants.service';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';

export function useImpersonate() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const startImpersonation = useCentralAuthStore((state) => state.startImpersonation);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const impersonate = useCallback(
    async (tenant: AdminTenant) => {
      if (impersonatingId) return;

      try {
        setImpersonatingId(tenant.id);
        const res = await adminTenantsService.impersonate(tenant.id);
        const { token, tenant_id, user } = res.data.result;

        localStorage.setItem('ibigan_token', token);
        localStorage.setItem('ibigan_tenant_id', tenant_id);
        setAuth(token, tenant_id, {
          id: user.id,
          name: user.name,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
        });
        startImpersonation({ id: tenant_id, name: tenant.name ?? tenant.slug });
        resetEcho();

        navigate('/dashboard', {
          state: {
            impersonationAlert: `Acessando ${tenant.name ?? tenant.slug}…`,
          },
        });
      } finally {
        setImpersonatingId(null);
      }
    },
    [impersonatingId, navigate, setAuth, startImpersonation],
  );

  return { impersonate, impersonatingId };
}
