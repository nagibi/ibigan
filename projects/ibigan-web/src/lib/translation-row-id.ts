import type { TranslationCatalogRow } from '@/lib/translation-catalog';

export function getTranslationRowId(row: TranslationCatalogRow): number {
  let hash = 0;
  const value = `${row.locale}:${row.key}`;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getTranslationRowKey(row: TranslationCatalogRow) {
  return `${row.locale}:${row.key}`;
}
