import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';

type RequirePermissionProps = {
  permission: string;
};

export function RequirePermission({ permission }: RequirePermissionProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission(permission));

  if (!hasPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
