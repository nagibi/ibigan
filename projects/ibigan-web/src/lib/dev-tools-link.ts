import { DEV_TOOLS_URLS, resolveDevToolsUrl } from '@/lib/dev-tools-urls';

const DEV_TOOLS_PATHS = new Set<string>(Object.values(DEV_TOOLS_URLS));

function isDevToolsPath(path: string): boolean {
  if (DEV_TOOLS_PATHS.has(path)) {
    return true;
  }

  try {
    const normalized = new URL(path, 'http://localhost').pathname.replace(/\/$/, '');

    return normalized === '/docs/api'
      || normalized === '/horizon'
      || normalized === '/telescope'
      || normalized === '/clockwork'
      || normalized === '/log-viewer'
      || normalized.endsWith('/docs/api')
      || normalized.endsWith('/horizon')
      || normalized.endsWith('/telescope')
      || normalized.endsWith('/clockwork')
      || normalized.endsWith('/log-viewer');
  } catch {
    return path.includes('/docs/api')
      || path.includes('/horizon')
      || path.includes('/telescope')
      || path.includes('/clockwork')
      || path.includes('/log-viewer');
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

  const url = new URL(resolveDevToolsUrl(path));

  const token = resolveAccessToken();

  if (token) {
    url.searchParams.set('access_token', token);

    const tenantId = resolveTenantId(token);
    if (tenantId) {
      url.searchParams.set('tenant_id', tenantId);
    }
  }

  return url.toString();
}

export function isDevToolsMenuPath(path?: string): boolean {
  return Boolean(path && isDevToolsPath(path));
}
