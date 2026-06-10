import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { notificationPreferencesService } from '@/services/notification-preferences.service';
import { PageBody } from '@/components/common/page-body';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';
import { FormPanel } from '@/components/grid/form-panel';
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

export function NotificationPreferencesPage() {
  const queryClient = useQueryClient();

  usePageToolbar({
    title: 'Preferências de Notificação',
    description: 'Configure como deseja ser notificado para cada tipo de evento.',
  });

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
    return (
      <FormPageSkeleton panels={[{ titleWidth: 'w-48', fields: 4 }]} />
    );
  }

  return (
    <PageBody>
      <FormPanel title="Canais por evento">
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
              <div key={event} className="flex items-center gap-4 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{info.label}</p>
                  <p className="text-xs text-muted-foreground">{info.description}</p>
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
      </FormPanel>
    </PageBody>
  );
}
