import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import { buildTenantLoginPath } from '@/lib/tenant-login-path';
import { resolvePostLoginDestination } from '@/lib/post-login-navigation';

export function CallbackPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const tenantId = searchParams.get('tenant_id');
    const error = searchParams.get('error');

    if (error) {
      logout();
      navigate(buildTenantLoginPath(tenantId, { error }));
      return;
    }

    if (!token || !tenantId) {
      navigate(buildTenantLoginPath(tenantId));
      return;
    }

    async function fetchUser() {
      try {
        localStorage.setItem('ibigan_token', token!);
        localStorage.setItem('ibigan_tenant_id', tenantId!);

        const { data } = await authService.me();
        setAuth(token!, tenantId!, data.result);
        navigate(await resolvePostLoginDestination(tenantId!));
      } catch {
        logout();
        navigate(buildTenantLoginPath(tenantId, { error: 'auth_failed' }));
      }
    }

    fetchUser();
  }, [searchParams, navigate, logout, setAuth]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="text-center space-y-3">
        <LoaderCircle className="size-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">{t('auth.login.submitting')}</p>
      </div>
    </div>
  );
}
