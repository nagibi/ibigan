import { format, parseISO } from 'date-fns';
import type { Locale } from 'date-fns/locale';
import i18n from '@/i18n/i18next';
import { getDateFnsLocale } from '@/lib/date-locale';

export function parseFilterDate(value: string): Date | undefined {
  if (!value) return undefined;
  try {
    return parseISO(value);
  } catch {
    return undefined;
  }
}

export function formatFilterDate(value: string, locale?: Locale): string {
  const date = parseFilterDate(value);
  if (!date) return value;
  return format(date, 'P', { locale: locale ?? getDateFnsLocale(i18n.language) });
}

export function toIsoDate(date?: Date): string {
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}

export function formatDateRangeFilterLabel(
  from: string,
  to: string,
  locale?: Locale,
): string {
  const dateLocale = locale ?? getDateFnsLocale(i18n.language);

  if (from && to) {
    return `${formatFilterDate(from, dateLocale)} — ${formatFilterDate(to, dateLocale)}`;
  }
  if (from) {
    return i18n.t('grid.date_from', { date: formatFilterDate(from, dateLocale) });
  }
  if (to) {
    return i18n.t('grid.date_to', { date: formatFilterDate(to, dateLocale) });
  }
  return '';
}
