import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2,
  Check,
  CheckCircle,
  Download,
  LoaderCircle,
  Mail,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { type AppNotification } from '@/services/notifications.service';
import { downloadReportResultCsv } from '@/services/reports.service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';

function getType(notification: AppNotification): string {
  return notification.type.split('\\').pop() ?? '';
}

interface NotificationItemProps {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({ notification, onMarkRead, onDelete }: NotificationItemProps) {
  const [downloading, setDownloading] = useState(false);
  const type = getType(notification);
  const data = notification.data;
  const isUnread = !notification.read_at;
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR });

  async function handleDownloadReport() {
    const templateId = Number(data.template_id);
    const executionId = Number(data.execution_id);
    const templateName = String(data.template_name ?? 'relatorio');

    if (!templateId || !executionId) {
      toast.error('Dados do relatório indisponíveis.');
      return;
    }

    setDownloading(true);
    try {
      await downloadReportResultCsv(templateId, executionId, templateName);
      toast.success('Download iniciado.');
      if (isUnread) onMarkRead(notification.id);
    } catch {
      toast.error('Não foi possível baixar o relatório.');
    } finally {
      setDownloading(false);
    }
  }

  const actions = (
    <div className="flex gap-1 shrink-0 self-start">
      {isUnread && (
        <Button
          variant="ghost"
          mode="icon"
          size="sm"
          className="size-7"
          onClick={() => onMarkRead(notification.id)}
        >
          <Check className="size-3" />
        </Button>
      )}
      <Button
        variant="ghost"
        mode="icon"
        size="sm"
        className="size-7"
        onClick={() => onDelete(notification.id)}
      >
        <Trash2 className="size-3 text-destructive" />
      </Button>
    </div>
  );

  if (type === 'ReportCompletedNotification') {
    const templateName = String(data.template_name ?? 'Relatório');
    const rowsCount = data.rows_count ?? 0;
    const durationMs = data.duration_ms ?? 0;
    const templateId = data.template_id;

    return (
      <div className={cn('flex gap-2.5 px-5 py-4', isUnread && 'bg-primary/5')}>
        <div className="flex items-center justify-center size-10 bg-green-500/10 rounded-full shrink-0">
          <BarChart2 className="size-5 text-green-600" />
        </div>
        <div className="flex flex-col gap-3 grow min-w-0">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">
              <span className="text-secondary-foreground">Relatório pronto: </span>
              {templateId ? (
                <Link
                  to={`/reports/${templateId}/executar`}
                  className="hover:text-primary text-mono font-semibold"
                  onClick={() => isUnread && onMarkRead(notification.id)}
                >
                  {templateName}
                </Link>
              ) : (
                <span className="font-semibold">{templateName}</span>
              )}
            </div>
            <span className="flex items-center text-xs font-medium text-muted-foreground">
              {timeAgo}
              <span className="rounded-full size-1 bg-mono/30 mx-1.5" />
              {rowsCount} registros · {durationMs}ms
            </span>
          </div>

          <Card className="shadow-none flex items-center flex-row gap-2 p-2.5 rounded-lg bg-muted/70">
            <img
              src={toAbsoluteUrl('/media/file-types/xls.svg')}
              className="h-5 shrink-0"
              alt="CSV"
            />
            <button
              type="button"
              className="hover:text-primary font-medium text-secondary-foreground text-xs truncate text-left"
              onClick={handleDownloadReport}
              disabled={downloading}
            >
              {downloading ? 'Baixando...' : `${templateName}.csv`}
            </button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto shrink-0 h-7 px-2"
              onClick={handleDownloadReport}
              disabled={downloading}
            >
              {downloading
                ? <LoaderCircle className="size-3.5 animate-spin" />
                : <Download className="size-3.5" />}
            </Button>
          </Card>
        </div>
        {actions}
      </div>
    );
  }

  if (type === 'UserCreatedNotification') {
    const userName = String(data.user_name ?? 'Usuário');
    const userEmail = String(data.user_email ?? '');
    const userId = data.user_id;

    return (
      <div className={cn('flex gap-2.5 px-5 py-4', isUnread && 'bg-primary/5')}>
        <div className="flex items-center justify-center size-10 bg-primary/10 rounded-full shrink-0">
          <UserPlus className="size-5 text-primary" />
        </div>
        <div className="flex flex-col gap-3 grow min-w-0">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">
              <span className="text-secondary-foreground">Novo usuário: </span>
              <span className="font-semibold">{userName}</span>
            </div>
            <span className="text-xs font-medium text-muted-foreground">{timeAgo}</span>
          </div>

          <Card className="shadow-none flex items-center flex-row justify-between gap-2 p-2.5 rounded-lg bg-muted/70">
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-mono text-xs truncate">{userName}</span>
              {userEmail && (
                <span className="text-muted-foreground font-medium text-xs truncate">{userEmail}</span>
              )}
            </div>
            {userId && (
              <Link
                to={`/users/${userId}/editar`}
                className="hover:text-primary text-primary font-medium text-xs shrink-0"
                onClick={() => isUnread && onMarkRead(notification.id)}
              >
                Ver perfil
              </Link>
            )}
          </Card>
        </div>
        {actions}
      </div>
    );
  }

  if (type === 'TemplateNotification' || data.subject) {
    const subject = String(data.subject ?? 'Nova mensagem');
    const body = data.body ? String(data.body) : '';

    return (
      <div className={cn('flex gap-2.5 px-5 py-4', isUnread && 'bg-primary/5')}>
        <div className="flex items-center justify-center size-10 bg-blue-500/10 rounded-full shrink-0">
          <Mail className="size-5 text-blue-600" />
        </div>
        <div className="flex flex-col gap-2 grow min-w-0">
          <div className="flex flex-col gap-1">
            <div className={cn('text-sm font-medium', isUnread && 'font-semibold')}>{subject}</div>
            <span className="text-xs font-medium text-muted-foreground">{timeAgo}</span>
          </div>
          {body && (
            <Card className="shadow-none p-2.5 rounded-lg bg-muted/70">
              <p className="text-xs text-secondary-foreground line-clamp-3">{body}</p>
            </Card>
          )}
        </div>
        {actions}
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-2.5 px-5 py-4', isUnread && 'bg-primary/5')}>
      <div className="flex items-center justify-center size-8 bg-green-500/10 rounded-full border border-green-500/20 shrink-0">
        <CheckCircle className="size-4 text-green-600" />
      </div>
      <div className="flex flex-col gap-1 grow min-w-0">
        <span className={cn('text-sm font-medium text-secondary-foreground', isUnread && 'font-semibold')}>
          Nova notificação
        </span>
        <span className="text-xs font-medium text-muted-foreground">{timeAgo}</span>
      </div>
      {actions}
    </div>
  );
}
