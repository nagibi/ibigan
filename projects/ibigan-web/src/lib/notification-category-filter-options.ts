import { useMemo } from 'react';
import { NOTIFICATION_EVENT_CATALOG } from '@/lib/notification-events';
import type { GridSelectOption } from '@/lib/grid-filter-options';

export function buildNotificationCategoryFilterOptions(): GridSelectOption[] {
  const options: GridSelectOption[] = [{ label: 'Relatórios', value: 'report' }];
  const seenLabels = new Set(['Relatórios']);

  const sortedEvents = [...NOTIFICATION_EVENT_CATALOG].sort((a, b) =>
    a.label.localeCompare(b.label, 'pt-BR'),
  );

  for (const event of sortedEvents) {
    if (event.slug === 'report.completed') continue;
    if (seenLabels.has(event.label)) continue;

    seenLabels.add(event.label);
    options.push({ label: event.label, value: event.slug });
  }

  return options;
}

export function useNotificationCategoryFilterOptions(): GridSelectOption[] {
  return useMemo(() => buildNotificationCategoryFilterOptions(), []);
}
