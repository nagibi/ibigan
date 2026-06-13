import i18n from '@/i18n/i18next';
import type { EntityKey } from '@/lib/entity-i18n';
import { entityLabelKey, entityLabelPluralKey } from '@/lib/entity-i18n';

export type ToggleActiveLabels = {
  singular: string;
  plural: string;
};

export const TOGGLE_ACTIVE_LABELS = {
  user: { singularKey: 'entities.user', pluralKey: 'entities.user_plural' },
  menu: { singularKey: 'entities.menu', pluralKey: 'entities.menu_plural' },
  template: { singularKey: 'entities.template', pluralKey: 'entities.template_plural' },
  message_template: {
    singularKey: 'entities.message_template',
    pluralKey: 'entities.message_template_plural',
  },
  webhook: { singularKey: 'entities.webhook', pluralKey: 'entities.webhook_plural' },
  report: { singularKey: 'entities.report', pluralKey: 'entities.report_plural' },
  campaign: { singularKey: 'entities.campaign', pluralKey: 'entities.campaign_plural' },
  company: { singularKey: 'entities.company', pluralKey: 'entities.company_plural' },
  record: { singularKey: 'entities.record', pluralKey: 'entities.record_plural' },
} as const satisfies Record<string, { singularKey: string; pluralKey: string }>;

export type ToggleActiveLabelKey = keyof typeof TOGGLE_ACTIVE_LABELS;

export function getToggleActiveLabels(key: ToggleActiveLabelKey): ToggleActiveLabels {
  const config = TOGGLE_ACTIVE_LABELS[key];

  return {
    singular: i18n.t(config.singularKey),
    plural: i18n.t(config.pluralKey),
  };
}

/** @deprecated Prefer `getToggleActiveLabels` com chave tipada ou `useEntityToggleLabels`. */
export function toggleActiveLabelsFromEntity(entityLabel: string): ToggleActiveLabels {
  const normalized = entityLabel.trim().toLowerCase();

  const legacyMap: Record<string, ToggleActiveLabelKey> = {
    usuário: 'user',
    usuario: 'user',
    menu: 'menu',
    template: 'template',
    webhook: 'webhook',
    relatório: 'report',
    relatorio: 'report',
    campanha: 'campaign',
    empresa: 'company',
    registro: 'record',
  };

  const key = legacyMap[normalized];

  if (key) {
    return getToggleActiveLabels(key);
  }

  return {
    singular: entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1),
    plural: `${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)}s`,
  };
}

export function getToggleActiveLabelsByEntityKey(key: EntityKey): ToggleActiveLabels {
  return {
    singular: i18n.t(entityLabelKey(key)),
    plural: i18n.t(entityLabelPluralKey(key)),
  };
}

export function formatToggleActiveMessage(
  isActive: boolean,
  labels: ToggleActiveLabels,
  count = 1,
): string {
  const entity = count === 1 ? labels.singular : labels.plural;
  const messageKey = isActive
    ? (count === 1 ? 'toolbar.activated_one' : 'toolbar.activated_many')
    : (count === 1 ? 'toolbar.deactivated_one' : 'toolbar.deactivated_many');

  return i18n.t(messageKey, { entity });
}
