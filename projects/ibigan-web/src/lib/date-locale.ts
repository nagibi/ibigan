import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { enUS, ptBR, type Locale } from 'date-fns/locale';

const DATE_LOCALES: Record<string, Locale> = {
  pt: ptBR,
  en: enUS,
};

export function getDateFnsLocale(language: string): Locale {
  const base = language.split('-')[0]?.toLowerCase() ?? 'pt';
  return DATE_LOCALES[base] ?? ptBR;
}

export function useDateLocale(): Locale {
  const { i18n } = useTranslation();
  return useMemo(() => getDateFnsLocale(i18n.language), [i18n.language]);
}
