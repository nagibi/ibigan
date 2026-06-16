import { defineNotificationEvent } from '@/lib/notification-events/define-event';
import type { NotificationEventDefinition } from '@/types/notification-events';

export const PLATFORM_NOTIFICATION_EVENTS: NotificationEventDefinition[] = [
  defineNotificationEvent({
    slug: 'report.completed',
    module: 'platform',
    category: 'platform',
    label: 'Relatório concluído',
    description: 'Quando um relatório termina de ser processado.',
    severity: 'info',
    default_audience: ['manager', 'admin'],
    default_channels: ['app', 'email'],
  }),
  defineNotificationEvent({
    slug: 'campaign.sent',
    module: 'platform',
    category: 'platform',
    label: 'Campanha enviada',
    description: 'Quando uma campanha é enviada com sucesso.',
    severity: 'info',
    default_audience: ['admin'],
    default_channels: ['app'],
  }),
  defineNotificationEvent({
    slug: 'invite.accepted',
    module: 'platform',
    category: 'platform',
    label: 'Convite aceito',
    description: 'Quando alguém aceita um convite para a organização.',
    severity: 'info',
    default_audience: ['admin'],
    default_channels: ['app', 'email'],
  }),
  defineNotificationEvent({
    slug: 'user.created',
    module: 'platform',
    category: 'platform',
    label: 'Usuário criado',
    description: 'Quando um novo usuário é criado na organização.',
    severity: 'info',
    default_audience: ['admin'],
    default_channels: ['app'],
  }),
];
