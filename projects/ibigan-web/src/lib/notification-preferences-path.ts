export const NOTIFICATION_PREFERENCES_PATH = '/notification-preferences';

export function isNotificationPreferencesPath(path?: string): boolean {
  return path === NOTIFICATION_PREFERENCES_PATH;
}
