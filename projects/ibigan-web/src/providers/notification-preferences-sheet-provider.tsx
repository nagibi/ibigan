import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { NotificationPreferencesSheet } from '@/components/notifications/notification-preferences-sheet';

interface NotificationPreferencesSheetContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const NotificationPreferencesSheetContext =
  createContext<NotificationPreferencesSheetContextValue | null>(null);

export function NotificationPreferencesSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openSheet = useCallback(() => setOpen(true), []);
  const closeSheet = useCallback(() => setOpen(false), []);

  const value = useMemo(
    () => ({
      isOpen: open,
      open: openSheet,
      close: closeSheet,
    }),
    [open, openSheet, closeSheet],
  );

  return (
    <NotificationPreferencesSheetContext.Provider value={value}>
      {children}
      <NotificationPreferencesSheet open={open} onOpenChange={setOpen} />
    </NotificationPreferencesSheetContext.Provider>
  );
}

export function useNotificationPreferencesSheet() {
  const context = useContext(NotificationPreferencesSheetContext);

  if (!context) {
    throw new Error(
      'useNotificationPreferencesSheet must be used within NotificationPreferencesSheetProvider',
    );
  }

  return context;
}
