import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ToggleActiveLabels } from '@/lib/toggle-active-alert';

export const ENTITY_KEYS = [
  'record',
  'user',
  'menu',
  'template',
  'message_template',
  'webhook',
  'report',
  'campaign',
  'company',
  'invite',
  'role',
  'permission',
  'translation',
  'tenant',
  'notification',
  'approval',
] as const;

export type EntityKey = (typeof ENTITY_KEYS)[number];

export function entityLabelKey(key: EntityKey): string {
  return `entities.${key}`;
}

export function entityLabelPluralKey(key: EntityKey): string {
  return `entities.${key}_plural`;
}

export function useEntityLabel(key: EntityKey): string {
  const { t } = useTranslation();
  return t(entityLabelKey(key));
}

export function useEntityToggleLabels(key: EntityKey): ToggleActiveLabels {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      singular: t(entityLabelKey(key)),
      plural: t(entityLabelPluralKey(key)),
    }),
    [key, t],
  );
}

export function useInactiveRecordAlert(key: EntityKey) {
  const { t } = useTranslation();
  const entity = useEntityLabel(key);

  return useMemo(
    () => ({
      variant: 'destructive' as const,
      title: t('toolbar.inactive_record', { entity }),
      autoDismissMs: false as const,
      id: 'inactive',
    }),
    [entity, t],
  );
}
