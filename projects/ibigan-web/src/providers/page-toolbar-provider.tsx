import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import type { PageBreadcrumbItem } from '@/lib/build-page-breadcrumbs';
import type { ToolbarAlertConfig } from '@/components/grid/toolbar-alert';

export type PageToolbarConfig = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  alert?: ToolbarAlertConfig | null;
  breadcrumbs?: PageBreadcrumbItem[];
};

type Listener = () => void;

class PageToolbarStore {
  private config: PageToolbarConfig | null = null;
  private listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.config;

  setConfig = (next: PageToolbarConfig | null) => {
    this.config = next;
    this.listeners.forEach((listener) => listener());
  };

  clearPageAlert = () => {
    if (!this.config?.alert) return;
    this.config = { ...this.config, alert: null };
    this.listeners.forEach((listener) => listener());
  };
}

const pageToolbarStore = new PageToolbarStore();

const SetPageToolbarContext = createContext<
  ((config: PageToolbarConfig | null) => void) | null
>(null);

export function PageToolbarProvider({ children }: { children: ReactNode }) {
  const setConfig = useCallback((next: PageToolbarConfig | null) => {
    pageToolbarStore.setConfig(next);
  }, []);

  return (
    <SetPageToolbarContext.Provider value={setConfig}>
      {children}
    </SetPageToolbarContext.Provider>
  );
}

export function useSetPageToolbar() {
  const setConfig = useContext(SetPageToolbarContext);

  if (!setConfig) {
    throw new Error('useSetPageToolbar must be used within PageToolbarProvider');
  }

  return setConfig;
}

export function usePageToolbarConfig() {
  return useSyncExternalStore(
    pageToolbarStore.subscribe,
    pageToolbarStore.getSnapshot,
  );
}

export function usePageToolbarActionsVisible() {
  const config = usePageToolbarConfig();
  return Boolean(config?.actions);
}

export function useClearPageToolbarAlert() {
  return useCallback(() => {
    pageToolbarStore.clearPageAlert();
  }, []);
}

export function useClearPageToolbarAlertOnNavigate() {
  const { pathname, key } = useLocation();
  const clearPageAlert = useClearPageToolbarAlert();

  useLayoutEffect(() => {
    clearPageAlert();
  }, [pathname, key, clearPageAlert]);
}
