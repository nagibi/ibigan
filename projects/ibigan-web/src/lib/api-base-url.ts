/**
 * Base URL da API. Em dev com subdomínios (*.localhost), use `/api` relativo
 * para que o Host da requisição coincida com o host da página.
 */
export function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, '');
  }

  return '/api';
}

function resolveApiOrigin(baseUrl: string): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (baseUrl.startsWith('/')) {
    return window.location.origin;
  }

  try {
    return new URL(baseUrl).origin;
  } catch {
    return null;
  }
}

/**
 * Quando a página está em outro host que o da API (ex.: tenant.localhost → localhost/api),
 * informa o host original para resolução de tenant no backend.
 */
export function applyTenantHostHeader(
  headers: Record<string, string>,
  baseUrl = resolveApiBaseUrl(),
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const apiOrigin = resolveApiOrigin(baseUrl);
  if (!apiOrigin || apiOrigin === window.location.origin) {
    return;
  }

  headers['X-Forwarded-Host'] = window.location.host;
}
