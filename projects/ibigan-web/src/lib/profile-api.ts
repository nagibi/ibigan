import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';

/** Sessão só com token central, sem tenant selecionado. */
export function isCentralOnlySession(): boolean {
  const isAuthenticated = useAuthStore.getState().isAuthenticated;
  const isCentralAuthenticated = useCentralAuthStore.getState().isCentralAuthenticated;
  return isCentralAuthenticated && !isAuthenticated;
}

export function profileApiBase(): string {
  return isCentralOnlySession() ? '/central/v1/profile' : '/v1/profile';
}

export function twoFactorApiBase(): string {
  return isCentralOnlySession() ? '/central/v1/two-factor' : '/v1/two-factor';
}
