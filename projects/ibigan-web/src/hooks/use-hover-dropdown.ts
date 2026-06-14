import { useCallback, useEffect, useRef, useState } from 'react';

export function useHoverDropdown(closeDelayMs = 120) {
  const [open, setOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current !== null) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleEnter = useCallback(() => {
    cancelClose();
    setOpen(true);
  }, [cancelClose]);

  const handleLeave = useCallback(() => {
    cancelClose();
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      closeTimeoutRef.current = null;
    }, closeDelayMs);
  }, [cancelClose, closeDelayMs]);

  useEffect(() => cancelClose, [cancelClose]);

  return {
    open,
    setOpen,
    handleEnter,
    handleLeave,
  };
}
