import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { resetEcho } from '@/lib/echo';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

export function useTenantSwitch() {
  const { setAuth } = useAuthStore();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const switchToTenant = useCallback(
    async (tenantId: string) => {
      if (switchingId) return false;

      try {
        setSwitchingId(tenantId);
        const res = await authService.switchTenant(tenantId);
        const { token, tenant_id } = res.data.result;

        localStorage.setItem('ibigan_token', token);
        localStorage.setItem('ibigan_tenant_id', tenant_id);

        const meRes = await authService.me();
        setAuth(token, tenant_id, meRes.data.result);
        resetEcho();

        toast.success('Organização alterada com sucesso.');

        window.location.href = '/dashboard';
        return true;
      } catch {
        toast.error('Erro ao acessar organização.');
        return false;
      } finally {
        setSwitchingId(null);
      }
    },
    [setAuth, switchingId],
  );

  return { switchToTenant, switchingId };
}
