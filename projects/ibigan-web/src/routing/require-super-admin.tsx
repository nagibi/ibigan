import { Navigate, Outlet } from 'react-router-dom';
import { useCentralAuthStore } from '@/stores/central-auth.store';

/**
 * Guarda rotas com prefixo `/admin/*` (escopo SaaS).
 * Ver docs/ROUTING.md.
 */
export function RequireSuperAdmin() {
  const centralUser = useCentralAuthStore((state) => state.centralUser);

  if (!centralUser?.is_super_admin) {
    return <Navigate to="/central/login" replace />;
  }

  return <Outlet />;
}
