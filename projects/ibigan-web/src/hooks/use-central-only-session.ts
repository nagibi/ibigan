import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';

/** Sessão só com token central, sem tenant selecionado. */
export function useCentralOnlySession(): boolean {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isCentralAuthenticated = useCentralAuthStore((state) => state.isCentralAuthenticated);
  return isCentralAuthenticated && !isAuthenticated;
}
