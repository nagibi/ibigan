import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { notificationPreferencesService } from '@/services/notification-preferences.service';
import { InfoHint } from '@/components/common/info-hint';
import { NotificationPreferencesSkeleton } from '@/components/common/side-panel-skeleton';
import { Switch } from '@/components/ui/switch';

const EVENT_LABELS: Record<string, { label: string; description: string }> = {
  'report.completed': {
    label: 'Relatório concluído',
    description: 'Quando um relatório termina de ser processado',
  },
  'campaign.sent': {
    label: 'Campanha enviada',
    description: 'Quando uma campanha é enviada com sucesso',
  },
  'invite.accepted': {
    label: 'Convite aceito',
    description: 'Quando alguém aceita um convite para a organização',
  },
  'user.created': {
    label: 'Usuário criado',
    description: 'Quando um novo usuário é criado na organização',
  },
};

export function NotificationPreferencesContent() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationPreferencesService.get(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ event, channel, enabled }: { event: string; channel: string; enabled: boolean }) =>
      notificationPreferencesService.update(event, channel, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: () => toast.error('Erro ao atualizar preferência.'),
  });

  const preferences = data?.data.result ?? {};

  if (isLoading) {
    return <NotificationPreferencesSkeleton />;
  }

  return (
    <div className="divide-y rounded-md border">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="min-w-0 flex-1 text-sm font-medium text-muted-foreground">Evento</div>
        <div className="flex w-40 shrink-0 items-center justify-around text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="size-3.5" />
            E-mail
          </span>
          <span className="flex items-center gap-1">
            <Smartphone className="size-3.5" />
            App
          </span>
        </div>
      </div>

      {Object.entries(EVENT_LABELS).map(([event, info]) => {
        const prefs = preferences[event] ?? { email: false, app: false };

        return (
          <div key={event} className="flex items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{info.label}</p>
                <InfoHint content={info.description} side="bottom" />
              </div>
            </div>
            <div className="flex w-40 shrink-0 items-center justify-around">
              <Switch
                checked={prefs.email}
                onCheckedChange={(enabled) =>
                  updateMutation.mutate({ event, channel: 'email', enabled })
                }
                disabled={updateMutation.isPending}
              />
              <Switch
                checked={prefs.app}
                onCheckedChange={(enabled) =>
                  updateMutation.mutate({ event, channel: 'app', enabled })
                }
                disabled={updateMutation.isPending}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
