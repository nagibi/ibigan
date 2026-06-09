import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoaderCircle, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { notificationPreferencesService } from '@/services/notification-preferences.service';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
      <div className="container py-6 flex justify-center">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Preferências de Notificação</h1>
        <p className="text-sm text-muted-foreground">
          Configure como deseja ser notificado para cada tipo de evento.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-[1fr_80px_80px] gap-4 items-center">
            <div />
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Mail className="size-3" /> E-mail
            </div>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Smartphone className="size-3" /> App
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {Object.entries(EVENT_LABELS).map(([event, info]) => {
              const prefs = preferences[event] ?? { email: false, app: false };
              return (
                <div key={event} className="grid grid-cols-[1fr_80px_80px] gap-4 items-center px-6 py-4">
                  <div>
                    <p className="font-medium text-sm">{info.label}</p>
                    <p className="text-xs text-muted-foreground">{info.description}</p>
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={prefs.email}
                      onCheckedChange={(enabled) =>
                        updateMutation.mutate({ event, channel: 'email', enabled })
                      }
                      disabled={updateMutation.isPending}
                    />
                  </div>
                  <div className="flex justify-center">
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
        </CardContent>
      </Card>
    </div>
  );
}
