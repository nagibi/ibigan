import type { NotificationEventCategory } from '@/types/notification-events';

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationEventCategory, string> = {
  platform: 'Plataforma',
  loans: 'Empréstimos',
  inventory: 'Estoque',
  maintenance: 'Manutenção',
  critical: 'Equipamentos críticos',
  sites: 'Obras',
  employees: 'Colaboradores',
  insight: 'Inteligência e recomendações',
  digest: 'Resumos executivos',
};

/** Ordem de exibição na Central de Preferências. Categorias vazias são omitidas na UI. */
export const NOTIFICATION_CATEGORY_ORDER: NotificationEventCategory[] = [
  'insight',
  'loans',
  'inventory',
  'maintenance',
  'critical',
  'sites',
  'employees',
  'digest',
  'platform',
];
