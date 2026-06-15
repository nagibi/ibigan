import { authService, type UserTenant } from '@/services/auth.service';

export type PostLoginDestination = '/dashboard' | '/auth/select-tenant';

export function shouldSkipTenantSelection(
  loggedInTenantId: string,
  tenants: UserTenant[],
): boolean {
  if (tenants.length <= 1) {
    return true;
  }

  const loggedIn = tenants.find((tenant) => tenant.id === loggedInTenantId);

  return Boolean(loggedIn?.is_default);
}

export async function resolvePostLoginDestination(
  loggedInTenantId: string,
): Promise<PostLoginDestination> {
  try {
    const res = await authService.listTenants();
    const list = res.data.result ?? [];

    return shouldSkipTenantSelection(loggedInTenantId, list)
      ? '/dashboard'
      : '/auth/select-tenant';
  } catch {
    return '/auth/select-tenant';
  }
}

export function resolveAutoTenantId(tenants: UserTenant[]): string | null {
  if (tenants.length === 1) {
    return tenants[0].id;
  }

  return tenants.find((tenant) => tenant.is_default)?.id ?? null;
}
