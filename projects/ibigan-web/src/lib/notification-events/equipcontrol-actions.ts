import type { NotificationAction } from '@/types/notification-events';

function readString(data: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = data[key];
    if (value !== null && value !== undefined && String(value).trim() !== '') {
      return String(value);
    }
  }
  return null;
}

function buildNavigate(
  id: string,
  label: string,
  path: string,
  primary = true,
): NotificationAction {
  return { id, label, type: 'navigate', payload: { path }, primary };
}

function withSearch(basePath: string, patrimonio: string | null, filtro?: string): string {
  const params = new URLSearchParams();
  if (patrimonio) params.set('q', patrimonio);
  if (filtro) params.set('filtro', filtro);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/**
 * Ações de navegação padrão para eventos EquipControl quando o backend
 * ainda não envia `data.actions` no payload da notificação.
 */
export function resolveEquipcontrolNotificationActions(
  eventSlug: string,
  data: Record<string, unknown>,
): NotificationAction[] {
  const patrimonio = readString(data, 'patrimonio', 'equipamento_patrimonio', 'codigo');
  const obraId = readString(data, 'obra_id', 'obra');
  const emprestimoId = readString(data, 'emprestimo_id');

  if (eventSlug.startsWith('loan.')) {
    const path = emprestimoId
      ? `/equipamentos/movimentacoes/${emprestimoId}`
      : withSearch(
          '/equipamentos/movimentacoes',
          patrimonio,
          eventSlug === 'loan.overdue' ? 'vencidos' : eventSlug === 'loan.due_soon' ? 'proximos_vencimento' : undefined,
        );

    const actions = [buildNavigate('view-loan', 'Ver empréstimo', path)];

    if (patrimonio) {
      actions.push(
        buildNavigate(
          'view-equipment',
          'Ver equipamento',
          withSearch('/equipamentos/estoque', patrimonio),
          false,
        ),
      );
    }

    return actions;
  }

  if (eventSlug.startsWith('maintenance.')) {
    const path = withSearch(
      '/equipamentos/manutencao',
      patrimonio,
      eventSlug === 'maintenance.overdue' ? 'atrasados' : undefined,
    );
    return [buildNavigate('view-maintenance', 'Ver manutenção', path)];
  }

  if (
    eventSlug.startsWith('equipment.')
    || eventSlug.startsWith('critical.')
    || eventSlug === 'insight.return'
    || eventSlug === 'insight.reallocation'
    || eventSlug === 'insight.replacement'
  ) {
    const path = withSearch(
      '/equipamentos/estoque',
      patrimonio,
      eventSlug === 'equipment.idle' || eventSlug === 'critical.idle' ? 'parados' : undefined,
    );
    return [buildNavigate('view-equipment', 'Ver equipamento', path)];
  }

  if (eventSlug.startsWith('site.')) {
    const path = obraId ? `/equipamentos/obras/${obraId}` : '/equipamentos/dashboard';
    return [buildNavigate('view-site', obraId ? 'Ver obra' : 'Ver dashboard', path)];
  }

  if (eventSlug.startsWith('employee.')) {
    const userId = readString(data, 'user_id', 'colaborador_id');
    if (userId) {
      return [buildNavigate('view-user', 'Ver colaborador', `/users/${userId}`)];
    }
    return [buildNavigate('view-movements', 'Ver movimentações', '/equipamentos/movimentacoes')];
  }

  if (eventSlug.startsWith('insight.') || eventSlug.startsWith('digest.')) {
    return [buildNavigate('view-dashboard', 'Ver dashboard', '/equipamentos/dashboard')];
  }

  if (patrimonio) {
    return [
      buildNavigate('view-equipment', 'Ver equipamento', withSearch('/equipamentos/estoque', patrimonio)),
    ];
  }

  return [buildNavigate('view-dashboard', 'Abrir EquipControl', '/equipamentos/dashboard')];
}
