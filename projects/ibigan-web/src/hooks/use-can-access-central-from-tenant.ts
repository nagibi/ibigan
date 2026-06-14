import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';

/** Super-admin da plataforma com sessão de tenant ativa (impersonação ou acesso direto). */
export function useCanAccessCentralFromTenant(): boolean {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCentralAuthenticated = useCentralAuthStore((state) => state.isCentralAuthenticated);
  const isCentralSuperAdmin = useCentralAuthStore((state) => state.centralUser?.is_super_admin);

  return Boolean(isAuthenticated && isCentralAuthenticated && isCentralSuperAdmin);
}
