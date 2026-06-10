import { Activity } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { ActivityLog } from '@/services/activity-logs.service';
import {
  descriptionLabel,
  descriptionVariant,
  getActivityChanges,
  getSubjectLabel,
} from '@/lib/activity-log-utils';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ActivityLogDetailDialogProps {
  log: ActivityLog | null;
  onClose: () => void;
}

export function ActivityLogDetailDialog({ log, onClose }: ActivityLogDetailDialogProps) {
  const changes = log ? getActivityChanges(log.properties) : [];

  return (
    <Dialog open={log !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="size-4" />
            Detalhes da atividade
          </DialogTitle>
        </DialogHeader>
        {log && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/30 p-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Recurso</p>
                <p className="font-medium">
                  {getSubjectLabel(log.subject_type)} #{log.subject_id}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={descriptionVariant[log.description] ?? 'outline'}>
                  {descriptionLabel[log.description] ?? log.description}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Realizado por</p>
                <p className="font-medium">{log.causer_name ?? 'Sistema'}</p>
              </div>
              <div className="col-span-3">
                <p className="text-xs text-muted-foreground">Data</p>
                <p>
                  {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                </p>
              </div>
            </div>

            {changes.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-medium">Campos alterados</p>
                <div className="space-y-2">
                  {changes.map(({ key, oldValue, newValue }) => (
                    <div key={key} className="grid grid-cols-[140px_1fr_1fr] items-start gap-2 text-sm">
                      <span className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                        {key}
                      </span>
                      {oldValue !== undefined ? (
                        <>
                          <div className="break-all rounded bg-destructive/10 px-2 py-1 font-mono text-xs text-destructive line-through">
                            {String(oldValue ?? '—')}
                          </div>
                          <div className="break-all rounded bg-green-500/10 px-2 py-1 font-mono text-xs text-green-700">
                            {String(newValue ?? '—')}
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2 break-all px-2 py-1 font-mono text-xs">
                          {String(newValue ?? '—')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem detalhes adicionais.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
