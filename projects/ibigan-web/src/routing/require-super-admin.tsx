import { Navigate, Outlet } from 'react-router-dom';
import { useCentralAuthStore } from '@/stores/central-auth.store';

export function RequireSuperAdmin() {
  const centralUser = useCentralAuthStore((state) => state.centralUser);

  if (!centralUser?.is_super_admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
