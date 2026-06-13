import { endOfDay, startOfMonth, subMonths } from 'date-fns';
import { toIsoDate } from '@/lib/grid-date-filter-utils';

export interface DashboardDateRange {
  date_from: string;
  date_to: string;
}

export function getDefaultDashboardDateRange(): DashboardDateRange {
  const today = new Date();

  return {
    date_from: toIsoDate(startOfMonth(subMonths(today, 5))),
    date_to: toIsoDate(endOfDay(today)),
  };
}
