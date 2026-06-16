import type {
  NotificationChannel,
  NotificationDeliveryMode,
  NotificationEventDefinition,
  NotificationSeverity,
  NotificationTargetAudience,
} from '@/types/notification-events';
import type { NotificationEventCategory, NotificationModule } from '@/types/notification-events';

export interface DefineNotificationEventInput {
  slug: string;
  module: NotificationModule;
  category: NotificationEventCategory;
  label: string;
  description: string;
  example?: string;
  severity: NotificationSeverity;
  default_audience: NotificationTargetAudience[];
  allowed_channels?: NotificationChannel[];
  default_channels?: NotificationChannel[];
  default_delivery?: NotificationDeliveryMode;
  supports_digest?: boolean;
  supports_escalation?: boolean;
}

export function defineNotificationEvent(
  input: DefineNotificationEventInput,
): NotificationEventDefinition {
  const allowed = input.allowed_channels ?? ['app', 'email', 'whatsapp'];

  return {
    slug: input.slug,
    module: input.module,
    category: input.category,
    label: input.label,
    description: input.description,
    example: input.example,
    severity: input.severity,
    default_audience: input.default_audience,
    allowed_channels: allowed,
    default_channels: input.default_channels ?? ['app'],
    default_delivery: input.default_delivery ?? 'immediate',
    supports_digest: input.supports_digest ?? false,
    supports_escalation: input.supports_escalation ?? false,
  };
}
