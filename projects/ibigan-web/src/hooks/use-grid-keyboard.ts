import { useEffect } from 'react';

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;

  return Boolean(target.closest('[contenteditable="true"]'));
}

export interface UseGridKeyboardOptions {
  enabled?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onEscape?: () => void;
}

export function useGridKeyboard({
  enabled = true,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
  onEscape,
}: UseGridKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (isEditableTarget(event.target)) return;

      if (event.key === 'Escape') {
        onEscape?.();
        return;
      }

      if (event.key === 'Enter' && canEdit && onEdit) {
        event.preventDefault();
        onEdit();
        return;
      }

      if (event.key === 'Delete' && canDelete && onDelete) {
        event.preventDefault();
        onDelete();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, canEdit, canDelete, onEdit, onDelete, onEscape]);
}
