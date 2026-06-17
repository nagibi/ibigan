import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { NotificationModule } from '@/types/notification-events';

export interface NotificationPreferencesOpenOptions {
  module?: NotificationModule;
}

interface NotificationPreferencesSheetContextValue {
  isOpen: boolean;
  moduleFilter: NotificationModule | null;
  open: (options?: NotificationPreferencesOpenOptions) => void;
  close: () => void;
  setOpen: (open: boolean) => void;
}

const NotificationPreferencesSheetContext =
  createContext<NotificationPreferencesSheetContextValue | null>(null);

export function NotificationPreferencesSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [moduleFilter, setModuleFilter] = useState<NotificationModule | null>(null);

  const openSheet = useCallback((options?: NotificationPreferencesOpenOptions) => {
    setModuleFilter(options?.module ?? null);
    setOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setOpen(false);
    setModuleFilter(null);
  }, []);

  const handleSetOpen = useCallback((nextOpen: boolean) => {
    if (!nextOpen) {
      setModuleFilter(null);
    }
    setOpen(nextOpen);
  }, []);

  const value = useMemo(
    () => ({
      isOpen: open,
      moduleFilter,
      open: openSheet,
      close: closeSheet,
      setOpen: handleSetOpen,
    }),
    [open, moduleFilter, openSheet, closeSheet, handleSetOpen],
  );

  return (
    <NotificationPreferencesSheetContext.Provider value={value}>
      {children}
    </NotificationPreferencesSheetContext.Provider>
  );
}

export function useNotificationPreferencesSheet() {
  const context = useContext(NotificationPreferencesSheetContext);
  if (!context) {
    // fora do provider (ex: sidebar no contexto central) — sheet inerte
    return {
      isOpen: false,
      moduleFilter: null as NotificationModule | null,
      open: (_options?: NotificationPreferencesOpenOptions) => {},
      close: () => {},
      setOpen: () => {},
    };
  }
  return context;
}
