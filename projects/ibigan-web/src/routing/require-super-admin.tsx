import { Navigate, Outlet } from 'react-router-dom';
import { SUPER_ADMIN_ROLE } from '@/config/routing';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Guarda rotas com prefixo `/admin/*` (escopo SaaS).
 * Ver docs/ROUTING.md.
 */
export function RequireSuperAdmin() {
  const hasRole = useAuthStore((state) => state.hasRole);

  if (!hasRole(SUPER_ADMIN_ROLE)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
