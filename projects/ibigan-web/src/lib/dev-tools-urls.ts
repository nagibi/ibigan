function apiBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost/api';
  return apiUrl.replace(/\/api\/?$/, '');
}

export const DEV_TOOLS_URLS = {
  apiDocs:
    import.meta.env.VITE_DEV_API_DOCS_URL || `${apiBaseUrl()}/docs/api`,
  horizon:
    import.meta.env.VITE_DEV_HORIZON_URL || `${apiBaseUrl()}/horizon`,
  telescope:
    import.meta.env.VITE_DEV_TELESCOPE_URL || `${apiBaseUrl()}/telescope`,
  phpMyAdmin:
    import.meta.env.VITE_DEV_PHPMYADMIN_URL || 'http://localhost:8080',
  mailpit:
    import.meta.env.VITE_DEV_MAILPIT_URL || 'http://localhost:8025',
} as const;
