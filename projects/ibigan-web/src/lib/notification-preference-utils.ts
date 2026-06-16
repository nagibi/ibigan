import type {
  NotificationChannel,
  NotificationChannelPrefs,
  NotificationEventDefinition,
  NotificationPreferenceRecord,
  NotificationPreferencesMap,
} from '@/types/notification-events';
import { getNotificationEvent } from '@/lib/notification-events';

const CHANNEL_KEYS: NotificationChannel[] = ['app', 'email', 'whatsapp'];

export function isChannelAllowed(
  event: NotificationEventDefinition,
  channel: NotificationChannel,
): boolean {
  return event.allowed_channels.includes(channel);
}

export function resolveEventChannelPrefs(
  event: NotificationEventDefinition,
  stored?: Partial<NotificationChannelPrefs> | null,
): NotificationChannelPrefs {
  const prefs: NotificationChannelPrefs = {
    app: false,
    email: false,
    whatsapp: false,
  };

  for (const channel of CHANNEL_KEYS) {
    if (!isChannelAllowed(event, channel)) continue;

    if (stored && channel in stored && typeof stored[channel] === 'boolean') {
      prefs[channel] = stored[channel] as boolean;
      continue;
    }

    prefs[channel] = event.default_channels.includes(channel);
  }

  return prefs;
}

export function resolveEventPreference(
  slug: string,
  stored?: NotificationPreferenceRecord | null,
): NotificationPreferenceRecord | null {
  const event = getNotificationEvent(slug);
  if (!event) return stored ?? null;

  return {
    ...resolveEventChannelPrefs(event, stored),
    delivery_mode: stored?.delivery_mode ?? event.default_delivery,
  };
}

export function mergeNotificationPreferences(
  stored: NotificationPreferencesMap,
  catalogSlugs: string[],
): NotificationPreferencesMap {
  const merged: NotificationPreferencesMap = {};

  for (const slug of catalogSlugs) {
    const resolved = resolveEventPreference(slug, stored[slug]);
    if (resolved) merged[slug] = resolved;
  }

  return merged;
}

export function formatEventHint(event: NotificationEventDefinition): string {
  if (event.example) {
    return `${event.description}\n\nExemplo: ${event.example}`;
  }
  return event.description;
}
