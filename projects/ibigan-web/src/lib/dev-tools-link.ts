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
      || normalized.endsWith('/docs/api')
      || normalized.endsWith('/horizon');
  } catch {
    return path.includes('/docs/api') || path.includes('/horizon');
  }
}

function resolveAccessToken(): string | null {
  return localStorage.getItem('ibigan_token')
    ?? localStorage.getItem('ibigan_central_token');
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

  return url.toString();
}

export function isDevToolsMenuPath(path?: string): boolean {
  return Boolean(path && isDevToolsPath(path));
}
