import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2,
  Check,
  CheckCircle,
  LoaderCircle,
  Mail,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { type AppNotification } from '@/services/notifications.service';
import { getReportDownloadMeta } from '@/lib/notification-utils';
import { downloadReportResultCsv } from '@/services/reports.service';
import { getInitials } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
  AvatarIndicator,
  AvatarStatus,
} from '@/components/ui/avatar';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';

function getType(notification: AppNotification): string {
  return notification.type.split('\\').pop() ?? '';
}

function NotificationMeta({
  timeAgo,
  category,
}: {
  timeAgo: string;
  category: string;
}) {
  return (
    <span className="flex items-center text-xs font-medium text-muted-foreground">
      {timeAgo}
      <span className="mx-1.5 size-1 rounded-full bg-mono/30" />
      {category}
    </span>
  );
}

function NotificationAvatar({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Avatar className="size-10 shrink-0">
      <AvatarFallback className={cn('text-xs font-semibold', className)}>
        {children}
      </AvatarFallback>
      <AvatarIndicator className="-bottom-1.5 -end-1.5">
        <AvatarStatus variant="online" className="size-2.5" />
      </AvatarIndicator>
    </Avatar>
  );
}

function NotificationCloudUploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.63821 2.60467C4.81926 2.60467 3.32474 3.99623 3.16201 5.77252C3.1386 6.02803 2.92413 6.22253 2.66871 6.22227C1.74915 6.22149 0.976744 6.9868 0.976744 7.90442C0.976744 8.83344 1.72988 9.58657 2.65891 9.58657H3.09302C3.36274 9.58657 3.5814 9.80523 3.5814 10.0749C3.5814 10.3447 3.36274 10.5633 3.09302 10.5633H2.65891C1.19044 10.5633 0 9.37292 0 7.90442C0 6.58614 0.986948 5.48438 2.24496 5.27965C2.62863 3.20165 4.44941 1.62793 6.63821 1.62793C8.26781 1.62793 9.69282 2.50042 10.4729 3.80193C12.3411 3.72829 14 5.2564 14 7.18091C14 8.93508 12.665 10.3769 10.9552 10.5466C10.6868 10.5733 10.4476 10.3773 10.421 10.1089C10.3943 9.84052 10.5903 9.60135 10.8587 9.57465C12.0739 9.45406 13.0233 8.42802 13.0233 7.18091C13.0233 5.74002 11.6905 4.59666 10.2728 4.79968C10.0642 4.82957 9.85672 4.72382 9.76028 4.53181C9.18608 3.38796 8.00318 2.60467 6.63821 2.60467Z"
        fill="#99A1B7"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.99909 8.01611L8.28162 9.29864C8.47235 9.48937 8.78158 9.48937 8.97231 9.29864C9.16303 9.10792 9.16303 8.79874 8.97231 8.60802L7.57465 7.2103C7.25675 6.89247 6.74143 6.89247 6.42353 7.2103L5.02585 8.60802C4.83513 8.79874 4.83513 9.10792 5.02585 9.29864C5.21657 9.48937 5.5258 9.48937 5.71649 9.29864L6.99909 8.01611Z"
        fill="#99A1B7"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.00009 12.372C7.2698 12.372 7.48846 12.1533 7.48846 11.8836V7.97665C7.48846 7.70694 7.2698 7.48828 7.00009 7.48828C6.73038 7.48828 6.51172 7.70694 6.51172 7.97665V11.8836C6.51172 12.1533 6.73038 12.372 7.00009 12.372Z"
        fill="#99A1B7"
      />
    </svg>
  );
}

function NotificationFileCard({
  icon,
  fileName,
  fileMeta,
  onDownload,
  downloading,
  href,
  onNavigate,
}: {
  icon: string;
  fileName: string;
  fileMeta: string;
  onDownload: () => void;
  downloading?: boolean;
  href?: string;
  onNavigate?: () => void;
}) {
  const fileLabel = href ? (
    <Link
      to={href}
      className="text-xs font-medium text-secondary-foreground hover:text-primary"
      onClick={onNavigate}
    >
      {fileName}
    </Link>
  ) : (
    <button
      type="button"
      className="text-left text-xs font-medium text-secondary-foreground hover:text-primary"
      onClick={onDownload}
      disabled={downloading}
    >
      {downloading ? 'Baixando...' : fileName}
    </button>
  );

  return (
    <Card className="flex min-h-[52px] flex-row items-center justify-between gap-1.5 rounded-lg bg-muted/70 p-2.5 shadow-none">
      <div className="flex min-w-0 items-center gap-1.5">
        <img src={toAbsoluteUrl(icon)} className="h-6 shrink-0" alt="" />
        <div className="flex min-w-0 flex-col gap-0.5">
          {fileLabel}
          <span className="text-xs font-medium text-muted-foreground">{fileMeta}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        mode="icon"
        size="sm"
        className="size-8 shrink-0"
        onClick={onDownload}
        disabled={downloading}
        title="Baixar arquivo"
      >
        {downloading ? (
          <LoaderCircle className="size-3.5 animate-spin text-muted-foreground" />
        ) : (
          <NotificationCloudUploadIcon />
        )}
      </Button>
    </Card>
  );
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
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  async function handleDownloadReport() {
    const { templateId, executionId, templateName } = getReportDownloadMeta(notification);

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
    <div className="flex shrink-0 gap-1 self-start">
      {isUnread && (
        <Button
          variant="ghost"
          mode="icon"
          size="sm"
          className="size-7"
          onClick={() => onMarkRead(notification.id)}
          title="Marcar como lida"
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
        title="Remover"
      >
        <Trash2 className="size-3 text-destructive" />
      </Button>
    </div>
  );

  if (type === 'ReportCompletedNotification') {
    const { templateId, templateName, fileName, fileMeta } = getReportDownloadMeta(notification);

    return (
      <div className={cn('flex grow items-start gap-2.5 px-5', isUnread && 'bg-primary/5')}>
        <NotificationAvatar className="bg-green-500/10 text-green-700">
          <BarChart2 className="size-4" />
        </NotificationAvatar>
        <div className="relative flex min-w-0 grow flex-col gap-3.5">
          <div className="absolute end-0 top-0 z-10">{actions}</div>

          <div className="flex flex-col gap-1 pe-14">
            <div className="mb-px text-sm font-medium">
              {templateId ? (
                <Link
                  to={`/reports/${templateId}/executar`}
                  className="font-semibold text-mono hover:text-primary"
                  onClick={() => isUnread && onMarkRead(notification.id)}
                >
                  {templateName}
                </Link>
              ) : (
                <span className="font-semibold text-mono">{templateName}</span>
              )}
              <span className="text-secondary-foreground"> disponibilizou 1 anexo</span>
            </div>
            <NotificationMeta timeAgo={timeAgo} category="Relatórios" />
          </div>

          <div className="flex flex-col gap-2.5">
            <NotificationFileCard
              icon="/media/file-types/xls.svg"
              fileName={fileName}
              fileMeta={fileMeta}
              onDownload={handleDownloadReport}
              downloading={downloading}
              href={templateId ? `/reports/${templateId}/executar` : undefined}
              onNavigate={() => isUnread && onMarkRead(notification.id)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => void handleDownloadReport()}
                disabled={downloading}
              >
                {downloading ? 'Baixando...' : 'Baixar CSV'}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link
                  to="/reports/executions"
                  onClick={() => isUnread && onMarkRead(notification.id)}
                >
                  Ver execuções
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'UserCreatedNotification') {
    const userName = String(data.user_name ?? 'Usuário');
    const userEmail = String(data.user_email ?? '');
    const userId = data.user_id;

    return (
      <div className={cn('flex grow items-start gap-2.5 px-5', isUnread && 'bg-primary/5')}>
        <NotificationAvatar className="bg-primary/10 text-primary">
          {getInitials(userName, 2)}
        </NotificationAvatar>
        <div className="relative flex min-w-0 grow flex-col gap-3.5">
          <div className="absolute end-0 top-0 z-10">{actions}</div>
          <div className="flex flex-col gap-1 pe-14">
            <div className="text-sm font-medium">
              <span className="font-semibold text-mono">{userName}</span>
              <span className="text-secondary-foreground"> foi adicionado como usuário</span>
            </div>
            <NotificationMeta timeAgo={timeAgo} category="Usuários" />
          </div>

          <Card className="flex min-h-[52px] flex-row items-center justify-between gap-2 rounded-lg bg-muted/70 p-2.5 shadow-none">
            <div className="min-w-0">
              <span className="block truncate text-xs font-medium text-mono">{userName}</span>
              {userEmail && (
                <span className="block truncate text-xs font-medium text-muted-foreground">
                  {userEmail}
                </span>
              )}
            </div>
            {userId && (
              <Link
                to={`/users/${userId}`}
                className="shrink-0 text-xs font-medium text-primary hover:text-primary/80"
                onClick={() => isUnread && onMarkRead(notification.id)}
              >
                Ver perfil
              </Link>
            )}
          </Card>
        </div>
      </div>
    );
  }

  if (type === 'TemplateNotification' || data.subject) {
    const subject = String(data.subject ?? 'Nova mensagem');
    const body = data.body ? String(data.body) : '';

    return (
      <div className={cn('flex grow items-start gap-2.5 px-5', isUnread && 'bg-primary/5')}>
        <NotificationAvatar className="bg-blue-500/10 text-blue-600">
          <Mail className="size-4" />
        </NotificationAvatar>
        <div className="relative flex min-w-0 grow flex-col gap-3.5">
          <div className="absolute end-0 top-0 z-10">{actions}</div>
          <div className="flex flex-col gap-1 pe-14">
            <div className={cn('text-sm font-medium', isUnread && 'font-semibold')}>{subject}</div>
            <NotificationMeta timeAgo={timeAgo} category="Mensagens" />
          </div>
          {body && (
            <Card className="rounded-lg bg-muted/70 p-2.5 shadow-none">
              <p className="line-clamp-3 text-xs text-secondary-foreground">{body}</p>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex grow items-start gap-2.5 px-5', isUnread && 'bg-primary/5')}>
      <NotificationAvatar className="border border-green-500/20 bg-green-500/10 text-green-600">
        <CheckCircle className="size-4" />
      </NotificationAvatar>
      <div className="relative flex min-w-0 grow flex-col gap-1">
        <div className="absolute end-0 top-0 z-10">{actions}</div>
        <span className={cn('pe-14 text-sm font-medium text-secondary-foreground', isUnread && 'font-semibold')}>
          Nova notificação
        </span>
        <NotificationMeta timeAgo={timeAgo} category="Sistema" />
      </div>
    </div>
  );
}
