/**
 * Convenção de rotas do Ibigan (Opção C).
 *
 * - Sem prefixo (`/users`, `/menus`, …) → escopo do tenant (admin do tenant).
 * - Com prefixo `/admin` → escopo SaaS, exclusivo de super-admin.
 *
 * Ver docs/ROUTING.md para detalhes e exemplos.
 */
export const SUPER_ADMIN_ROLE = 'super-admin';

/** Prefixo de rotas exclusivas do super-admin do SaaS. */
export const SAAS_ADMIN_ROUTE_PREFIX = '/admin';

export function isSaasAdminRoute(pathname: string): boolean {
  return pathname === SAAS_ADMIN_ROUTE_PREFIX
    || pathname.startsWith(`${SAAS_ADMIN_ROUTE_PREFIX}/`);
}
