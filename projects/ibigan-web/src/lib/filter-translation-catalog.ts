import type { TranslationCatalogRow } from '@/lib/translation-catalog';

export function filterTranslationCatalog(
  rows: TranslationCatalogRow[],
  filters: Record<string, string>,
): TranslationCatalogRow[] {
  const keyFilter = filters.key?.trim().toLowerCase() ?? '';
  const localeFilter = filters.locale?.trim() ?? '';
  const defaultValueFilter = filters.defaultValue?.trim().toLowerCase() ?? '';
  const valueFilter = filters.value?.trim().toLowerCase() ?? '';

  if (!keyFilter && !localeFilter && !defaultValueFilter && !valueFilter) {
    return rows;
  }

  return rows.filter((row) => {
    if (keyFilter && !row.key.toLowerCase().includes(keyFilter)) {
      return false;
    }

    if (localeFilter && row.locale !== localeFilter) {
      return false;
    }

    if (defaultValueFilter && !row.defaultValue.toLowerCase().includes(defaultValueFilter)) {
      return false;
    }

    if (valueFilter) {
      const customValue = row.hasOverride ? row.value : '';
      if (!customValue.toLowerCase().includes(valueFilter)) {
        return false;
      }
    }

    return true;
  });
}
