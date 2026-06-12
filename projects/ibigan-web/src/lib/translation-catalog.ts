import enLocale from '@/i18n/locales/en.json';
import ptLocale from '@/i18n/locales/pt.json';
import type { TenantTranslation } from '@/services/translations.service';

const localeMessages = {
  pt: ptLocale,
  en: enLocale,
} as const;

export type TranslationLocale = keyof typeof localeMessages;

export interface TranslationCatalogRow {
  id?: number;
  key: string;
  locale: TranslationLocale;
  defaultValue: string;
  value: string;
  is_active: boolean;
  hasOverride: boolean;
}

function overrideKey(locale: string, key: string) {
  return `${locale}:${key}`;
}

export function buildTranslationCatalog(
  localeFilter: string,
  search: string,
  overrides: TenantTranslation[],
): TranslationCatalogRow[] {
  const locales: TranslationLocale[] =
    localeFilter === 'all' ? ['pt', 'en'] : [localeFilter as TranslationLocale];

  const overrideMap = new Map<string, TenantTranslation>();
  for (const override of overrides) {
    overrideMap.set(overrideKey(override.locale, override.key), override);
  }

  const normalizedSearch = search.trim().toLowerCase();
  const rows: TranslationCatalogRow[] = [];

  for (const locale of locales) {
    const messages = localeMessages[locale];
    if (!messages) continue;

    for (const key of Object.keys(messages).sort()) {
      const defaultValue = messages[key as keyof typeof messages] ?? '';
      const override = overrideMap.get(overrideKey(locale, key));
      const customValue = override?.value ?? '';

      if (normalizedSearch) {
        const matchesSearch =
          key.toLowerCase().includes(normalizedSearch)
          || defaultValue.toLowerCase().includes(normalizedSearch)
          || customValue.toLowerCase().includes(normalizedSearch);

        if (!matchesSearch) continue;
      }

      rows.push({
        id: override?.id,
        key,
        locale,
        defaultValue,
        value: customValue,
        is_active: override?.is_active ?? true,
        hasOverride: Boolean(override),
      });
    }
  }

  return rows.sort(
    (left, right) => left.key.localeCompare(right.key) || left.locale.localeCompare(right.locale),
  );
}
