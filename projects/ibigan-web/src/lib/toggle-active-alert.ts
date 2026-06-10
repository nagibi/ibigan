export type ToggleActiveLabels = {
  singular: string;
  plural: string;
};

export const TOGGLE_ACTIVE_LABELS = {
  user: { singular: 'Usuário', plural: 'Usuários' },
  menu: { singular: 'Menu', plural: 'Menus' },
  template: { singular: 'Template', plural: 'Templates' },
  webhook: { singular: 'Webhook', plural: 'Webhooks' },
  report: { singular: 'Relatório', plural: 'Relatórios' },
  empresa: { singular: 'Empresa', plural: 'Empresas' },
  record: { singular: 'Registro', plural: 'Registros' },
} as const satisfies Record<string, ToggleActiveLabels>;

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function pluralizeEntityLabel(entityLabel: string): string {
  const normalized = entityLabel.trim().toLowerCase();
  const presets: Record<string, string> = {
    usuário: TOGGLE_ACTIVE_LABELS.user.plural,
    usuario: TOGGLE_ACTIVE_LABELS.user.plural,
    menu: TOGGLE_ACTIVE_LABELS.menu.plural,
    template: TOGGLE_ACTIVE_LABELS.template.plural,
    webhook: TOGGLE_ACTIVE_LABELS.webhook.plural,
    relatório: TOGGLE_ACTIVE_LABELS.report.plural,
    relatorio: TOGGLE_ACTIVE_LABELS.report.plural,
    empresa: TOGGLE_ACTIVE_LABELS.empresa.plural,
    registro: TOGGLE_ACTIVE_LABELS.record.plural,
  };

  return presets[normalized] ?? `${capitalize(entityLabel)}s`;
}

export function toggleActiveLabelsFromEntity(entityLabel: string): ToggleActiveLabels {
  return {
    singular: capitalize(entityLabel),
    plural: pluralizeEntityLabel(entityLabel),
  };
}

export function formatToggleActiveMessage(
  isActive: boolean,
  labels: ToggleActiveLabels,
  count = 1,
): string {
  const label = count === 1 ? labels.singular : labels.plural;
  const verb = isActive
    ? (count === 1 ? 'ativado' : 'ativados')
    : (count === 1 ? 'inativado' : 'inativados');

  return `${label} ${verb}.`;
}
