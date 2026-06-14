function apiBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost/api';

  if (/^https?:\/\//i.test(apiUrl)) {
    return apiUrl.replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}`;
  }

  return 'http://localhost';
}

export { apiBaseUrl };

export const DEV_TOOLS_URLS = {
  apiDocs:
    import.meta.env.VITE_DEV_API_DOCS_URL || `${apiBaseUrl()}/docs/api`,
  horizon:
    import.meta.env.VITE_DEV_HORIZON_URL || `${apiBaseUrl()}/horizon`,
  telescope:
    import.meta.env.VITE_DEV_TELESCOPE_URL || `${apiBaseUrl()}/telescope`,
  clockwork:
    import.meta.env.VITE_DEV_CLOCKWORK_URL || `${apiBaseUrl()}/clockwork`,
  logViewer:
    import.meta.env.VITE_DEV_LOG_VIEWER_URL || `${apiBaseUrl()}/log-viewer`,
  phpMyAdmin:
    import.meta.env.VITE_DEV_PHPMYADMIN_URL || 'http://localhost:8080',
  mailpit:
    import.meta.env.VITE_DEV_MAILPIT_URL || 'http://localhost:8025',
} as const;

export function resolveDevToolsUrl(path: string): string {
  const base = apiBaseUrl().replace(/\/$/, '');

  if (/^https?:\/\//i.test(path)) {
    try {
      const parsed = new URL(path);

      return `${base}${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return path;
    }
  }

  const pathname = path.startsWith('/') ? path : `/${path}`;

  return `${base}${pathname}`;
}
