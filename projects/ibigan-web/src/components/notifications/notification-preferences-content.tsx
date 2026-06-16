import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Mail,
  MessageCircle,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { InfoHint } from '@/components/common/info-hint';
import { NotificationPreferencesSkeleton } from '@/components/common/side-panel-skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useNotificationEventCatalog } from '@/hooks/use-notification-event-catalog';
import { NOTIFICATION_CATEGORY_LABELS, NOTIFICATION_CATEGORY_ORDER } from '@/lib/notification-events';
import {
  formatEventHint,
  isChannelAllowed,
  mergeNotificationPreferences,
  resolveEventChannelPrefs,
} from '@/lib/notification-preference-utils';
import { cn } from '@/lib/utils';
import { notificationPreferencesService } from '@/services/notification-preferences.service';
import type {
  NotificationChannel,
  NotificationEventDefinition,
  NotificationSeverity,
} from '@/types/notification-events';

const VISIBLE_CHANNELS: Array<{
  key: NotificationChannel;
  label: string;
  icon: typeof Smartphone;
}> = [
  { key: 'app', label: 'App', icon: Smartphone },
  { key: 'email', label: 'E-mail', icon: Mail },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
];

const DEFAULT_OPEN_CATEGORIES = ['platform'];

function SeverityIndicator({ severity }: { severity: NotificationSeverity }) {
  const config = {
    info: {
      icon: Info,
      className: 'text-blue-600 dark:text-blue-400',
      label: 'Informativo',
    },
    warning: {
      icon: AlertTriangle,
      className: 'text-amber-600 dark:text-amber-400',
      label: 'Atenção',
    },
    critical: {
      icon: AlertCircle,
      className: 'text-destructive',
      label: 'Crítico',
    },
  }[severity];

  const Icon = config.icon;

  return (
    <span className={cn('flex size-5 shrink-0 items-center justify-center', config.className)} title={config.label}>
      <Icon className="size-3.5" aria-hidden />
    </span>
  );
}

function PreferenceRow({
  event,
  prefs,
  isPending,
  onToggle,
}: {
  event: NotificationEventDefinition;
  prefs: ReturnType<typeof resolveEventChannelPrefs>;
  isPending: boolean;
  onToggle: (channel: NotificationChannel, enabled: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <SeverityIndicator severity={event.severity} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-medium">{event.label}</p>
          <InfoHint content={formatEventHint(event)} side="bottom" />
          {event.supports_escalation ? (
            <Badge variant="outline" size="sm" className="text-[10px] font-normal">
              Escalonável
            </Badge>
          ) : null}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{event.description}</p>
      </div>
      <div className="flex w-[9.5rem] shrink-0 items-center justify-around pt-0.5">
        {VISIBLE_CHANNELS.map(({ key }) => {
          if (!isChannelAllowed(event, key)) {
            return <span key={key} className="size-8" aria-hidden />;
          }

          return (
            <Switch
              key={key}
              checked={prefs[key]}
              onCheckedChange={(enabled) => onToggle(key, enabled)}
              disabled={isPending}
              aria-label={`${event.label} — ${key}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export function NotificationPreferencesContent() {
  const queryClient = useQueryClient();
  const { catalog, eventsByCategory, isRemote } = useNotificationEventCatalog();

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

  const preferences = useMemo(
    () =>
      mergeNotificationPreferences(
        data?.data.result ?? {},
        catalog.map((event) => event.slug),
      ),
    [catalog, data?.data.result],
  );

  if (isLoading) {
    return <NotificationPreferencesSkeleton />;
  }

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Configure quais eventos deseja receber e por qual canal. As preferências respeitam os limites
        definidos pela sua empresa.
        {isRemote ? (
          <span className="mt-1 block text-[11px] text-muted-foreground/80">
            Catálogo sincronizado com o servidor.
          </span>
        ) : null}
      </p>

      <div className="overflow-hidden rounded-md border">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2.5">
          <div className="min-w-0 flex-1 text-xs font-medium text-muted-foreground">Evento</div>
          <div className="flex w-[9.5rem] shrink-0 items-center justify-around text-[10px] text-muted-foreground">
            {VISIBLE_CHANNELS.map(({ key, label, icon: Icon }) => (
              <span key={key} className="flex flex-col items-center gap-0.5">
                <Icon className="size-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <Accordion
          type="multiple"
          defaultValue={DEFAULT_OPEN_CATEGORIES}
          variant="outline"
          className="rounded-none border-0"
        >
          {NOTIFICATION_CATEGORY_ORDER.map((category) => {
            const events = eventsByCategory[category];
            if (events.length === 0) return null;

            return (
              <AccordionItem key={category} value={category} className="border-b last:border-b-0">
                <AccordionTrigger className="px-4 py-3 text-sm hover:no-underline">
                  <span className="flex items-center gap-2">
                    {NOTIFICATION_CATEGORY_LABELS[category]}
                    <Badge variant="secondary" size="sm" className="font-normal">
                      {events.length}
                    </Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="p-0">
                  <div className="divide-y">
                    {events.map((event) => (
                      <PreferenceRow
                        key={event.slug}
                        event={event}
                        prefs={resolveEventChannelPrefs(event, preferences[event.slug])}
                        isPending={updateMutation.isPending}
                        onToggle={(channel, enabled) =>
                          updateMutation.mutate({ event: event.slug, channel, enabled })
                        }
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
