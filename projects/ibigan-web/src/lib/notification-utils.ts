import type { AppNotification } from '@/services/notifications.service';
import type {
  NotificationAction,
  NotificationSeverity,
} from '@/types/notification-events';
import { getNotificationEvent } from '@/lib/notification-events';
import { resolveEquipcontrolNotificationActions } from '@/lib/notification-events/equipcontrol-actions';

export function getNotificationType(notification: AppNotification): string {
  return notification.type.split('\\').pop() ?? notification.type;
}

export function formatNotificationBody(body: unknown): string {
  return String(body ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isReportNotification(notification: AppNotification): boolean {
  const type = getNotificationType(notification);
  return type === 'ReportCompletedNotification' || Boolean(notification.data.template_id);
}

export function getNotificationTitle(notification: AppNotification): string {
  const data = notification.data;
  if (data.subject) return String(data.subject);
  if (data.template_name) return `Relatório "${String(data.template_name)}"`;
  if (data.message) return String(data.message);
  if (data.title) return String(data.title);
  return getNotificationType(notification);
}

export function getReportDownloadMeta(notification: AppNotification) {
  const data = notification.data;
  const templateId = Number(data.template_id);
  const executionId = Number(data.execution_id);
  const templateName = String(data.template_name ?? 'relatorio');
  const rowsCount = data.rows_count ?? 0;
  const durationMs = data.duration_ms ?? 0;

  return {
    templateId: Number.isFinite(templateId) ? templateId : null,
    executionId: Number.isFinite(executionId) ? executionId : null,
    templateName,
    fileName: `${templateName}.csv`,
    fileMeta: `${rowsCount} registros · ${durationMs}ms`,
  };
}

function parseNumericId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    return Number(value);
  }

  return null;
}

/** ID numérico do banco (distinto do UUID usado nas rotas da API). */
export function getNotificationRecordId(notification: AppNotification): number | null {
  const candidates = [
    notification.record_id,
    notification.data.record_id,
    notification.data.notification_id,
    notification.data.id,
  ];

  for (const candidate of candidates) {
    const numericId = parseNumericId(candidate);
    if (numericId != null) {
      return numericId;
    }
  }

  return null;
}

export function getNotificationEventSlug(notification: AppNotification): string | null {
  const slug = notification.data.event_slug ?? notification.data.event;
  return slug ? String(slug) : null;
}

export function getNotificationSeverity(notification: AppNotification): NotificationSeverity | null {
  const raw = notification.data.severity;
  if (raw === 'info' || raw === 'warning' || raw === 'critical') {
    return raw;
  }

  const slug = getNotificationEventSlug(notification);
  if (!slug) return null;

  return getNotificationEvent(slug)?.severity ?? null;
}

function parseAction(value: unknown): NotificationAction | null {
  if (!value || typeof value !== 'object') return null;

  const action = value as Record<string, unknown>;
  const id = action.id;
  const label = action.label;
  const type = action.type;

  if (typeof id !== 'string' || typeof label !== 'string' || typeof type !== 'string') {
    return null;
  }

  if (type !== 'navigate' && type !== 'api' && type !== 'modal') {
    return null;
  }

  return {
    id,
    label,
    type,
    payload: (action.payload as Record<string, unknown>) ?? {},
    primary: Boolean(action.primary),
  };
}

export function getNotificationActions(notification: AppNotification): NotificationAction[] {
  const raw = notification.data.actions;
  const fromApi = Array.isArray(raw)
    ? raw.map(parseAction).filter((action): action is NotificationAction => action !== null)
    : [];

  if (fromApi.length > 0) return fromApi;

  const slug = getNotificationEventSlug(notification);
  if (!slug) return [];

  const event = getNotificationEvent(slug);
  if (event?.module === 'equipcontrol') {
    return resolveEquipcontrolNotificationActions(slug, notification.data);
  }

  return [];
}

export function getNotificationCategoryLabel(notification: AppNotification): string | null {
  const slug = getNotificationEventSlug(notification);
  if (!slug) return null;

  const event = getNotificationEvent(slug);
  if (!event) return null;

  return event.label;
}

export function getNotificationCategoryDisplay(notification: AppNotification): string {
  if (isReportNotification(notification)) {
    return 'Relatórios';
  }

  return getNotificationCategoryLabel(notification) ?? getNotificationType(notification);
}
