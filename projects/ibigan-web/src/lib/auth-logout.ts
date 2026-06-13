import { resetEcho } from '@/lib/echo';
import { authService } from '@/services/auth.service';
import { centralAuthService } from '@/services/central-auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';

export type LogoutRedirectPath = '/central/login' | '/auth/login';

/** Sessão central (super-admin da plataforma), inclusive durante impersonação de tenant. */
export function isPlatformSuperAdminSession(): boolean {
  const { isCentralAuthenticated, impersonatedTenant } = useCentralAuthStore.getState();
  return isCentralAuthenticated || Boolean(impersonatedTenant);
}

export function getPostLogoutPath(): LogoutRedirectPath {
  return isPlatformSuperAdminSession() ? '/central/login' : '/auth/login';
}

export async function logoutFromApp(): Promise<LogoutRedirectPath> {
  const isSuperSession = isPlatformSuperAdminSession();
  const redirectTo: LogoutRedirectPath = isSuperSession ? '/central/login' : '/auth/login';
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
