import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';

/**
 * Permite perfil/notificações com sessão de tenant ou super-admin central sem tenant.
 */
export function RequireAccountSession() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCentralAuthenticated = useCentralAuthStore((state) => state.isCentralAuthenticated);
  const centralUser = useCentralAuthStore((state) => state.centralUser);

  if (isAuthenticated) {
    return <Outlet />;
  }

  if (isCentralAuthenticated && centralUser?.is_super_admin) {
    return <Outlet />;
  }

  return <Navigate to="/auth/login" replace />;
}
