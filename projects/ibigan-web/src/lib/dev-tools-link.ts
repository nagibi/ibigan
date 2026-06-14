import { DEV_TOOLS_URLS } from '@/lib/dev-tools-urls';

const DEV_TOOLS_PATHS = new Set<string>(Object.values(DEV_TOOLS_URLS));

function isDevToolsPath(path: string): boolean {
  if (DEV_TOOLS_PATHS.has(path)) {
    return true;
  }

  try {
    const normalized = new URL(path).pathname.replace(/\/$/, '');
    return normalized === '/docs/api'
      || normalized === '/horizon'
      || normalized === '/telescope'
      || normalized.endsWith('/docs/api')
      || normalized.endsWith('/horizon')
      || normalized.endsWith('/telescope');
  } catch {
    return path.includes('/docs/api')
      || path.includes('/horizon')
      || path.includes('/telescope');
  }
}

function resolveAccessToken(): string | null {
  return localStorage.getItem('ibigan_token')
    ?? localStorage.getItem('ibigan_central_token');
}

function resolveTenantId(token: string): string | null {
  const tenantToken = localStorage.getItem('ibigan_token');

  if (tenantToken && tenantToken === token) {
    return localStorage.getItem('ibigan_tenant_id');
  }

  return null;
}

export function buildDevToolsHref(path: string): string {
  if (!isDevToolsPath(path)) {
    return path;
  }

  const token = resolveAccessToken();

  if (!token) {
    return path;
  }

  const url = /^https?:\/\//i.test(path)
    ? new URL(path)
    : new URL(path, window.location.origin);

  url.searchParams.set('access_token', token);

  const tenantId = resolveTenantId(token);
  if (tenantId) {
    url.searchParams.set('tenant_id', tenantId);
  }

  return url.toString();
}

export function isDevToolsMenuPath(path?: string): boolean {
  return Boolean(path && isDevToolsPath(path));
}
