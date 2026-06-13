import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ActivityLog } from '@/services/activity-logs.service';
import {
  countActivityChanges,
  descriptionVariant,
  getActivityChanges,
  getActivityDescriptionLabel,
  getActivityIcon,
} from '@/lib/activity-log-utils';
import { TimelineItem } from '@/partials/activities/timeline-item';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface ActivityLogTimelineItemProps {
  log: ActivityLog;
  line?: boolean;
  subjectName?: string;
}

function formatFieldValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

export function ActivityLogTimelineItem({
  log,
  line = true,
  subjectName,
}: ActivityLogTimelineItemProps) {
  const Icon = getActivityIcon(log.description);
  const changes = getActivityChanges(log.properties ?? {});
  const changeCount = countActivityChanges(log.properties ?? {});
  const actor = log.causer_name ?? 'Sistema';
  const actionLabel = getActivityDescriptionLabel(log.description);
  const formattedDate = format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <TimelineItem icon={Icon} line={line}>
      <div className="flex min-w-0 max-w-full flex-col gap-2.5">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="min-w-0 text-sm text-foreground">
            <span className="font-semibold text-mono">{actor}</span>
            <span className="text-secondary-foreground"> {actionLabel.toLowerCase()} </span>
            <span className="break-all font-medium text-primary">{subjectName ?? `registro #${log.subject_id}`}</span>
          </div>
          <span className="flex min-w-0 flex-wrap items-center text-xs font-medium text-muted-foreground">
            {formattedDate}
            <span className="mx-1.5 size-1 rounded-full bg-mono/30" />
            <Badge variant={descriptionVariant[log.description] ?? 'outline'} className="h-5 px-1.5 text-[10px]">
              {actionLabel}
            </Badge>
            {changeCount > 0 && (
              <>
                <span className="mx-1.5 size-1 rounded-full bg-mono/30" />
                {changeCount} {changeCount === 1 ? 'campo' : 'campos'}
              </>
            )}
          </span>
        </div>

        {changes.length > 0 && (
          <Card className="flex min-w-0 max-w-full flex-col gap-2 rounded-lg border-0 bg-muted/70 p-3 shadow-none">
            {changes.slice(0, 4).map((change) => (
              <div key={change.key} className="min-w-0 text-xs">
                <span className="font-mono text-muted-foreground">{change.key}</span>
                {change.oldValue !== undefined ? (
                  <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <span className="break-all rounded bg-destructive/10 px-2 py-1 font-mono text-destructive line-through">
                      {formatFieldValue(change.oldValue)}
                    </span>
                    <span className="break-all rounded bg-green-500/10 px-2 py-1 font-mono text-green-700">
                      {formatFieldValue(change.newValue)}
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 break-all rounded bg-background/80 px-2 py-1 font-mono text-secondary-foreground">
                    {formatFieldValue(change.newValue)}
                  </p>
                )}
              </div>
            ))}
            {changes.length > 4 && (
              <p className="text-xs font-medium text-muted-foreground">
                +{changes.length - 4} alterações
              </p>
            )}
          </Card>
        )}
      </div>
    </TimelineItem>
  );
}
