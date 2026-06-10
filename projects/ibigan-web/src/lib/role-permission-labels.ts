export const PERMISSION_RESOURCE_LABELS: Record<string, string> = {
  usuario: 'Usuário',
  convite: 'Convite',
  aprovacao: 'Aprovação',
  empresa: 'Empresa',
  menu: 'Menu',
  relatorio: 'Relatório',
  permissao: 'Permissão',
  notificacao: 'Notificação',
  template: 'Template',
  campanha: 'Campanha',
  webhook: 'Webhook',
  log: 'Activity Log',
  configuracao: 'Configuração',
};

export const PERMISSION_ACTION_LABELS: Record<string, string> = {
  visualizar: 'Visualizar',
  gerenciar: 'Gerenciar',
};

export function formatPermissionResource(resource: string): string {
  return PERMISSION_RESOURCE_LABELS[resource] ?? resource;
}

export function formatPermissionAction(action: string): string {
  return PERMISSION_ACTION_LABELS[action] ?? action;
}

export function formatPermissionName(name: string): string {
  const [resource, action] = name.split('-', 2);
  if (!action) return name;
  return `${formatPermissionResource(resource)} · ${formatPermissionAction(action)}`;
}

export function formatRoleName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
