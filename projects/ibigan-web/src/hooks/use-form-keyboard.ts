import { useEffect } from 'react';
import {
  shouldIgnoreFormDeleteShortcut,
  shouldIgnoreFormSaveShortcut,
} from '@/lib/form-keyboard-shortcuts';

export interface UseFormKeyboardOptions {
  enabled?: boolean;
  onSave?: () => void;
  onRequestDelete?: () => void;
  isSubmitting?: boolean;
  isDeleting?: boolean;
}

export function useFormKeyboard({
  enabled = true,
  onSave,
  onRequestDelete,
  isSubmitting = false,
  isDeleting = false,
}: UseFormKeyboardOptions) {
  useEffect(() => {
    if (!enabled || !onSave) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter') return;
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      if (isSubmitting) return;
      if (shouldIgnoreFormSaveShortcut(event)) return;

      event.preventDefault();
      onSave();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isSubmitting, onSave]);

  useEffect(() => {
    if (!enabled || !onRequestDelete) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Delete') return;
      if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
      if (isDeleting || isSubmitting) return;
      if (shouldIgnoreFormDeleteShortcut(event)) return;

      event.preventDefault();
      onRequestDelete();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isDeleting, isSubmitting, onRequestDelete]);
}
