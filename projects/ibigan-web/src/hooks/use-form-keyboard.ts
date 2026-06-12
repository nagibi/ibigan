import { useEffect } from 'react';

function hasOpenOverlay() {
  return Boolean(
    document.querySelector(
      [
        '[data-state="open"][role="dialog"]',
        '[data-state="open"][role="alertdialog"]',
        '[data-radix-select-content][data-state="open"]',
        '[data-radix-menu-content][data-state="open"]',
        '[data-radix-popover-content][data-state="open"]',
      ].join(', '),
    ),
  );
}

function shouldIgnoreEnter(event: KeyboardEvent) {
  if (event.defaultPrevented) return true;
  if (event.isComposing) return true;

  const target = event.target;
  if (!(target instanceof HTMLElement)) return true;

  if (target instanceof HTMLTextAreaElement) return true;
  if (target.isContentEditable) return true;
  if (target.closest('[contenteditable="true"]')) return true;
  if (target.closest('.page-toolbar, [data-slot="sheet-content"], [role="dialog"]')) return true;
  if (target.closest('button[role="combobox"]')) return true;
  if (hasOpenOverlay()) return true;

  if (target instanceof HTMLButtonElement && target.type !== 'submit') return true;

  return false;
}

export interface UseFormKeyboardOptions {
  enabled?: boolean;
  onSave?: () => void;
  isSubmitting?: boolean;
}

export function useFormKeyboard({
  enabled = true,
  onSave,
  isSubmitting = false,
}: UseFormKeyboardOptions) {
  useEffect(() => {
    if (!enabled || !onSave) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter') return;
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      if (isSubmitting) return;
      if (shouldIgnoreEnter(event)) return;

      event.preventDefault();
      onSave();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isSubmitting, onSave]);
}
