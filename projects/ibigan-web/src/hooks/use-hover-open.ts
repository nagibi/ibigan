import { useCallback, useRef, useState } from 'react';

const DEFAULT_CLOSE_DELAY_MS = 150;

export function useHoverOpen(closeDelayMs = DEFAULT_CLOSE_DELAY_MS) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = undefined;
    }
  }, []);

  const handleOpen = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const handleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), closeDelayMs);
  }, [clearCloseTimer, closeDelayMs]);

  const hoverProps = {
    onPointerEnter: handleOpen,
    onPointerLeave: handleClose,
  };

  return { open, setOpen, hoverProps };
}
