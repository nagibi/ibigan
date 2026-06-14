import type { AppNotification } from '@/services/notifications.service';

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
