import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { SecuritySheet } from '@/components/security/security-sheet';

interface SecuritySheetContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const SecuritySheetContext = createContext<SecuritySheetContextValue | null>(null);

export function SecuritySheetProvider({ children }: { children: ReactNode }) {
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
    <SecuritySheetContext.Provider value={value}>
      {children}
      <SecuritySheet open={open} onOpenChange={setOpen} />
    </SecuritySheetContext.Provider>
  );
}

export function useSecuritySheet() {
  const context = useContext(SecuritySheetContext);
  if (!context) {
    return { isOpen: false, open: () => {}, close: () => {} };
  }
  return context;
}
