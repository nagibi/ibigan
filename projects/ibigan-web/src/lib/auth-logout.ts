import { resetEcho } from '@/lib/echo';
import { buildTenantLoginPath } from '@/lib/tenant-login-path';
import { authService } from '@/services/auth.service';
import { centralAuthService } from '@/services/central-auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';

export type LogoutRedirectPath = string;

/** Sessão central (super-admin da plataforma), inclusive durante impersonação de tenant. */
export function isPlatformSuperAdminSession(): boolean {
  const { isCentralAuthenticated, impersonatedTenant } = useCentralAuthStore.getState();
  return isCentralAuthenticated || Boolean(impersonatedTenant);
}

export function getPostLogoutPath(): LogoutRedirectPath {
  if (isPlatformSuperAdminSession()) {
    return '/central/login';
  }

  const tenantSlug = useAuthStore.getState().tenantId
    ?? localStorage.getItem('ibigan_tenant_id');

  return buildTenantLoginPath(tenantSlug);
}

export async function logoutFromApp(): Promise<LogoutRedirectPath> {
  const isSuperSession = isPlatformSuperAdminSession();
  const tenantSlug = !isSuperSession
    ? (useAuthStore.getState().tenantId ?? localStorage.getItem('ibigan_tenant_id'))
    : null;
  const redirectTo: LogoutRedirectPath = isSuperSession
    ? '/central/login'
    : buildTenantLoginPath(tenantSlug);
  const { isAuthenticated } = useAuthStore.getState();

  if (isAuthenticated) {
    try {
      await authService.logout();
    } catch {
      // ignora erro de rede
    }
  }

  if (isSuperSession) {
    try {
      await centralAuthService.logout();
    } catch {
      // ignora erro de rede
    }
  }

  resetEcho();
  useAuthStore.getState().logout();

  if (isSuperSession) {
    useCentralAuthStore.getState().centralLogout();
  }

  return redirectTo;
}
