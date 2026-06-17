import { describe, expect, it } from 'vitest';
import { EQUIPCONTROL_NOTIFICATION_EVENTS } from '@/lib/notification-events/modules/equipcontrol-events';
import {
  getNotificationEvent,
  getNotificationEventCatalog,
  getRegisteredNotificationModules,
} from '@/lib/notification-events';
import '@/lib/notification-events/index';

describe('catálogo de eventos de notificação', () => {
  it('registra eventos EquipControl junto com a plataforma', () => {
    const modules = getRegisteredNotificationModules();

    expect(modules).toContain('platform');
    expect(modules).toContain('equipcontrol');
  });

  it('expõe loan.overdue com app e e-mail nos canais padrão', () => {
    const event = getNotificationEvent('loan.overdue');

    expect(event).toBeDefined();
    expect(event?.module).toBe('equipcontrol');
    expect(event?.allowed_channels).toEqual(expect.arrayContaining(['app', 'email']));
    expect(event?.default_channels).toEqual(expect.arrayContaining(['app', 'email']));
  });

  it('contém todos os slugs declarados no módulo EquipControl', () => {
    const catalogSlugs = new Set(getNotificationEventCatalog().map((event) => event.slug));
    const moduleSlugs = EQUIPCONTROL_NOTIFICATION_EVENTS.map((event) => event.slug);

    for (const slug of moduleSlugs) {
      expect(catalogSlugs.has(slug)).toBe(true);
    }
  });
});
