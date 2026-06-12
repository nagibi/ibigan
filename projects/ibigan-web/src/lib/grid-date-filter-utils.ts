import { format, parseISO } from 'date-fns';
import type { Locale } from 'date-fns/locale';
import dayjs, { type Dayjs } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import i18n from '@/i18n/i18next';
import { getDateFnsLocale } from '@/lib/date-locale';

dayjs.extend(isoWeek);

export type DateRangePreset = [Dayjs, Dayjs];

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

export function parseFilterDayjs(value: string): Dayjs | null {
  if (!value) return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

export function dayjsToIso(value?: Dayjs | null): string {
  if (!value?.isValid()) return '';
  return value.format('YYYY-MM-DD');
}

export type DateRangeValue = [Dayjs | null, Dayjs | null] | null;

function dayRange(date: Dayjs): DateRangePreset {
  const normalized = date.startOf('day');
  return [normalized, normalized];
}

export function getDateRangePresetToday(): DateRangePreset {
  return dayRange(dayjs());
}

export function getDateRangePresetYesterday(): DateRangePreset {
  return dayRange(dayjs().subtract(1, 'day'));
}

export function getDateRangePresetLastWeek(): DateRangePreset {
  const reference = dayjs().subtract(1, 'week');
  return [
    reference.startOf('isoWeek'),
    reference.endOf('isoWeek'),
  ];
}

export function getDateRangePresetLastMonth(): DateRangePreset {
  const reference = dayjs().subtract(1, 'month');
  return [
    reference.startOf('month'),
    reference.endOf('month'),
  ];
}

export function toDateRangeValue(from: string, to: string): DateRangeValue {
  const start = parseFilterDayjs(from);
  const end = parseFilterDayjs(to);

  if (!start && !end) {
    return null;
  }

  return [start, end];
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
