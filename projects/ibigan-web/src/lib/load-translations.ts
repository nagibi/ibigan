import axios from 'axios';
import i18n from '@/i18n/i18next';
import { applyTenantHostHeader, resolveApiBaseUrl } from '@/lib/api-base-url';

const publicApi = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

publicApi.interceptors.request.use((config) => {
  if (!config.headers) {
    config.headers = {};
  }

  applyTenantHostHeader(config.headers as Record<string, string>);

  return config;
});

/**
 * Carrega sobrescritas da empresa (platform_translations no banco central).
 * O bundle local já renderiza a UI; a API só customiza chaves específicas.
 */
export async function loadTenantTranslationOverrides(
  locale: string,
  tenantId?: string | null,
): Promise<void> {
  if (!tenantId) {
    return;
  }

  const { data } = await publicApi.get<{
    result: { locale: string; overrides: Record<string, string> };
  }>('/v1/translations', {
    params: { locale },
    headers: { 'X-Tenant-ID': tenantId },
  });

  const overrides = data.result.overrides;
  if (!overrides || Object.keys(overrides).length === 0) {
    return;
  }

  i18n.addResourceBundle(
    data.result.locale,
    'translation',
    overrides,
    true,
    true,
  );
}

/** @deprecated use loadTenantTranslationOverrides */
export const loadTenantTranslations = loadTenantTranslationOverrides;

export async function reloadTranslationsForLocale(
  locale: string,
  options?: { tenantId?: string | null },
): Promise<void> {
  await i18n.changeLanguage(locale);

  const tenantId = options?.tenantId ?? localStorage.getItem('ibigan_tenant_id');
  if (tenantId) {
    await loadTenantTranslationOverrides(locale, tenantId);
  }
}
