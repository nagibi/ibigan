import { useCallback, useSyncExternalStore } from 'react';
import type { ToolbarAlertConfig } from '@/components/grid/toolbar-alert';
import { TOOLBAR_ALERT_AUTO_DISMISS_MS } from '@/components/grid/toolbar-alert';

function getAutoDismissMs(alert: ToolbarAlertConfig) {
  if (alert.autoDismissMs === false) return null;
  return alert.autoDismissMs ?? TOOLBAR_ALERT_AUTO_DISMISS_MS;
}

type Listener = () => void;

class ToolbarAlertStore {
  private alert: ToolbarAlertConfig | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.alert;

  private notify = () => {
    this.listeners.forEach((listener) => listener());
  };

  private clearTimer = () => {
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  };

  show = (alert: ToolbarAlertConfig) => {
    this.clearTimer();
    this.alert = alert;
    this.notify();

    const dismissMs = getAutoDismissMs(alert);
    if (dismissMs != null && dismissMs > 0) {
      this.timer = setTimeout(() => this.dismiss(), dismissMs);
    }
  };

  dismiss = () => {
    this.clearTimer();
    this.alert = null;
    this.notify();
  };
}

export const toolbarAlertStore = new ToolbarAlertStore();

export function useGlobalToolbarAlert() {
  return useSyncExternalStore(
    toolbarAlertStore.subscribe,
    toolbarAlertStore.getSnapshot,
  );
}

export function useDismissGlobalToolbarAlert() {
  return useCallback(() => toolbarAlertStore.dismiss(), []);
}
