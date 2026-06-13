import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { NotificationPreferencesSheet } from '@/components/notifications/notification-preferences-sheet';
import { NotificationsSheetPanel } from '@/partials/topbar/notifications-sheet-panel';
import { useCentralOnlySession } from '@/hooks/use-central-only-session';
import { useNotificationPreferencesSheet } from '@/providers/notification-preferences-sheet-provider';

interface NotificationsSheetContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const NotificationsSheetContext = createContext<NotificationsSheetContextValue | null>(null);

function NotificationSheetsHost({
  notificationsOpen,
  onNotificationsOpenChange,
}: {
  notificationsOpen: boolean;
  onNotificationsOpenChange: (open: boolean) => void;
}) {
  const { isOpen: preferencesOpen, setOpen: setPreferencesOpen } = useNotificationPreferencesSheet();

  return (
    <>
      <NotificationsSheetPanel
        open={notificationsOpen}
        onOpenChange={onNotificationsOpenChange}
      />
      <NotificationPreferencesSheet
        open={preferencesOpen}
        onOpenChange={setPreferencesOpen}
      />
    </>
  );
}

export function NotificationsSheetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const isCentralOnly = useCentralOnlySession();

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
    <NotificationsSheetContext.Provider value={value}>
      {children}
      {!isCentralOnly ? (
        <NotificationSheetsHost
          notificationsOpen={open}
          onNotificationsOpenChange={setOpen}
        />
      ) : null}
    </NotificationsSheetContext.Provider>
  );
}

export function useNotificationsSheet() {
  const context = useContext(NotificationsSheetContext);
  if (!context) {
    return { isOpen: false, open: () => {}, close: () => {} };
  }
  return context;
}
