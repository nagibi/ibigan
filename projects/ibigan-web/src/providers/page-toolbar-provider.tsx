import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

export type PageToolbarConfig = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
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
