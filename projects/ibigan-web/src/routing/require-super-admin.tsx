import { Navigate, Outlet } from 'react-router-dom';
import { useCentralAuthStore } from '@/stores/central-auth.store';

export function RequireSuperAdmin() {
  const { centralUser, isCentralAuthenticated } = useCentralAuthStore();

  if (!isCentralAuthenticated) {
    return <Navigate to="/central/login" replace />;
  }

  if (!centralUser?.is_super_admin) {
    return <Navigate to="/central/login" replace />;
  }

  return <Outlet />;
}
