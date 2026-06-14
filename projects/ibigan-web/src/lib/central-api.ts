/**
 * Rotas que usam token central (auth:central), sem X-Tenant-ID.
 * /central/v1/tenants e /central/v1/tenants/switch usam token de tenant.
 */
export function isCentralApiRoute(url: string): boolean {
  return url.includes('/central/v1/admin/')
    || url.includes('/central/v1/auth/')
    || url.includes('/central/v1/profile')
    || url.includes('/central/v1/two-factor');
}
