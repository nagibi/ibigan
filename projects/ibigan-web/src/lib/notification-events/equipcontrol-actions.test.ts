import { describe, expect, it } from 'vitest';
import { resolveEquipcontrolNotificationActions } from '@/lib/notification-events/equipcontrol-actions';

describe('resolveEquipcontrolNotificationActions', () => {
  it('gera navegação para empréstimo vencido com patrimônio', () => {
    const actions = resolveEquipcontrolNotificationActions('loan.overdue', {
      patrimonio: 'EQ-001',
    });

    expect(actions[0]).toMatchObject({
      id: 'view-loan',
      type: 'navigate',
      payload: { path: '/equipamentos/movimentacoes?q=EQ-001&filtro=vencidos' },
      primary: true,
    });
    expect(actions[1]).toMatchObject({
      id: 'view-equipment',
      payload: { path: '/equipamentos/estoque?q=EQ-001' },
    });
  });

  it('gera navegação direta quando emprestimo_id está presente', () => {
    const actions = resolveEquipcontrolNotificationActions('loan.due_soon', {
      emprestimo_id: '42',
    });

    expect(actions[0].payload.path).toBe('/equipamentos/movimentacoes/42');
  });

  it('gera navegação para manutenção atrasada', () => {
    const actions = resolveEquipcontrolNotificationActions('maintenance.overdue', {
      patrimonio: 'GER-10',
    });

    expect(actions[0]).toMatchObject({
      id: 'view-maintenance',
      payload: { path: '/equipamentos/manutencao?q=GER-10&filtro=atrasados' },
    });
  });

  it('cai no dashboard quando não há contexto suficiente', () => {
    const actions = resolveEquipcontrolNotificationActions('digest.daily', {});

    expect(actions[0]).toMatchObject({
      id: 'view-dashboard',
      payload: { path: '/equipamentos/dashboard' },
    });
  });
});
