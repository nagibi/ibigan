import axios from 'axios';
import i18n from '@/i18n/i18next';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost/api',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Carrega sobrescritas do tenant (tenant_translations) e mescla sobre o JSON local.
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
