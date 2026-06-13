import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

type PageRefreshState = {
  onRefresh: (() => void) | null;
  isRefreshing: boolean;
};

type Listener = () => void;

class PageRefreshStore {
  private state: PageRefreshState = {
    onRefresh: null,
    isRefreshing: false,
  };

  private listeners = new Set<Listener>();

  subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = () => this.state;

  setRefresh = (onRefresh: (() => void) | null, isRefreshing = false) => {
    if (
      this.state.onRefresh === onRefresh
      && this.state.isRefreshing === isRefreshing
    ) {
      return;
    }

    this.state = { onRefresh, isRefreshing };
    this.listeners.forEach((listener) => listener());
  };
}

const pageRefreshStore = new PageRefreshStore();

const SetPageRefreshContext = createContext<
  ((onRefresh: (() => void) | null, isRefreshing?: boolean) => void) | null
>(null);

export function PageRefreshProvider({ children }: { children: ReactNode }) {
  const setRefresh = useCallback(
    (onRefresh: (() => void) | null, isRefreshing = false) => {
      pageRefreshStore.setRefresh(onRefresh, isRefreshing);
    },
    [],
  );

  return (
    <SetPageRefreshContext.Provider value={setRefresh}>
      {children}
    </SetPageRefreshContext.Provider>
  );
}

export function usePageRefreshState() {
  return useSyncExternalStore(
    pageRefreshStore.subscribe,
    pageRefreshStore.getSnapshot,
  );
}

export function useRegisterPageRefresh(
  onRefresh: (() => void) | undefined,
  isRefreshing = false,
) {
  const setRefresh = useContext(SetPageRefreshContext);

  useLayoutEffect(() => {
    if (!setRefresh || !onRefresh) {
      return;
    }

    setRefresh(onRefresh, isRefreshing);

    return () => setRefresh(null, false);
  }, [setRefresh, onRefresh, isRefreshing]);
}
