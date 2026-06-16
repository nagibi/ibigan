import type { NotificationEventDefinition } from '@/types/notification-events';
import {
  NOTIFICATION_CATEGORY_ORDER,
  getNotificationEventCatalog,
} from '@/lib/notification-events';

export function mergeNotificationEventCatalogs(
  remote: NotificationEventDefinition[],
  local: NotificationEventDefinition[],
): NotificationEventDefinition[] {
  const bySlug = new Map<string, NotificationEventDefinition>();

  for (const event of local) {
    bySlug.set(event.slug, event);
  }

  for (const event of remote) {
    bySlug.set(event.slug, event);
  }

  const merged = [...bySlug.values()];

  merged.sort((left, right) => {
    const leftIndex = NOTIFICATION_CATEGORY_ORDER.indexOf(left.category);
    const rightIndex = NOTIFICATION_CATEGORY_ORDER.indexOf(right.category);
    const categoryOrder = leftIndex - rightIndex;
    if (categoryOrder !== 0) return categoryOrder;
    return left.label.localeCompare(right.label, 'pt-BR');
  });

  return merged;
}

export function groupEventsByCategory(
  events: NotificationEventDefinition[],
): Record<string, NotificationEventDefinition[]> {
  const grouped: Record<string, NotificationEventDefinition[]> = {};

  for (const category of NOTIFICATION_CATEGORY_ORDER) {
    grouped[category] = [];
  }

  for (const event of events) {
    if (!grouped[event.category]) {
      grouped[event.category] = [];
    }
    grouped[event.category].push(event);
  }

  return grouped;
}

export function resolveActiveNotificationCatalog(
  remote: NotificationEventDefinition[] | undefined,
  useRemote: boolean,
): NotificationEventDefinition[] {
  const local = getNotificationEventCatalog();

  if (!useRemote || !remote?.length) {
    return local;
  }

  return mergeNotificationEventCatalogs(remote, local);
}
