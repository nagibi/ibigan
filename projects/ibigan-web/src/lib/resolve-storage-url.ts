import { resolveApiBaseUrl } from '@/lib/api-base-url';

/** Origem onde nginx/Laravel servem /storage (porta 80 em dev, não o Vite :5173). */
export function resolveAssetOrigin(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const apiBase = resolveApiBaseUrl();

  if (apiBase.startsWith('/')) {
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}`;
    }

    return window.location.origin;
  }

  try {
    return new URL(apiBase).origin;
  } catch {
    return window.location.origin;
  }
}

function getTenantStoragePrefix(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const tenantId = localStorage.getItem('ibigan_tenant_id');
  if (!tenantId) {
    return null;
  }

  return `/storage/tenant${tenantId}/app/public/`;
}

export function resolveStoragePublicUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) {
    return null;
  }

  const origin = resolveAssetOrigin();
  let url = pathOrUrl;

  if (url.startsWith('/')) {
    url = `${origin}${url}`;
  }

  const tenancyMatch = url.match(/\/tenancy\/assets\/storage\/(.+)$/);
  if (tenancyMatch) {
    const storagePrefix = getTenantStoragePrefix();
    if (storagePrefix) {
      return `${origin}${storagePrefix}${tenancyMatch[1]}`;
    }
  }

  if (/^https?:\/\/picsum\.photos\?random=(\d+)$/.test(url)) {
    const match = url.match(/^https?:\/\/picsum\.photos\?random=(\d+)$/);
    return match ? `https://picsum.photos/96/96?random=${match[1]}` : url;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const storagePrefix = getTenantStoragePrefix();
  if (storagePrefix) {
    return `${origin}${storagePrefix}${url}`;
  }

  return `${origin}/storage/${url}`;
}
