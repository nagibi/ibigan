import { describe, expect, it } from 'vitest';
import { getNotificationActions, getNotificationRecordId } from '@/lib/notification-utils';
import '@/lib/notification-events/index';
import type { AppNotification } from '@/services/notifications.service';

function buildNotification(data: Record<string, unknown>, overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: '26cc93f6-af2a-4595-bce9-b33c38a6c076',
    type: 'App\\Notifications\\EquipcontrolNotification',
    data,
    read_at: null,
    created_at: '2026-06-16T12:00:00.000Z',
    ...overrides,
  };
}

describe('getNotificationRecordId', () => {
  it('prioriza record_id retornado pela API', () => {
    const notification = buildNotification({}, { record_id: 42 });

    expect(getNotificationRecordId(notification)).toBe(42);
  });

  it('não usa o UUID da rota como fallback visual', () => {
    expect(getNotificationRecordId(buildNotification({}))).toBeNull();
  });
});

describe('getNotificationActions — EquipControl', () => {
  it('prioriza ações enviadas pela API', () => {
    const notification = buildNotification({
      event_slug: 'loan.overdue',
      actions: [
        {
          id: 'custom',
          label: 'Abrir painel',
          type: 'navigate',
          payload: { path: '/custom' },
          primary: true,
        },
      ],
    });

    expect(getNotificationActions(notification)).toEqual([
      {
        id: 'custom',
        label: 'Abrir painel',
        type: 'navigate',
        payload: { path: '/custom' },
        primary: true,
      },
    ]);
  });

  it('usa fallback de navegação EquipControl quando a API não envia ações', () => {
    const notification = buildNotification({
      event_slug: 'loan.overdue',
      patrimonio: 'EQ-100',
    });

    const actions = getNotificationActions(notification);

    expect(actions[0]?.type).toBe('navigate');
    expect(actions[0]?.payload.path).toContain('/equipamentos/movimentacoes');
    expect(actions[0]?.payload.path).toContain('EQ-100');
  });

  it('retorna vazio para eventos desconhecidos sem ações na API', () => {
    const notification = buildNotification({
      event_slug: 'unknown.event',
    });

    expect(getNotificationActions(notification)).toEqual([]);
  });
});
