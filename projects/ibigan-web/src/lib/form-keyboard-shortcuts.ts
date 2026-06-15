export function hasOpenOverlay(): boolean {
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

export function isFormFieldFocused(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target instanceof HTMLInputElement) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  if (target.isContentEditable) return true;
  if (target.closest('[contenteditable="true"]')) return true;
  if (target.closest('button[role="combobox"]')) return true;

  return false;
}

export function shouldIgnoreFormSaveShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) return true;
  if (event.isComposing) return true;
  if (hasOpenOverlay()) return true;

  const target = event.target;
  if (!(target instanceof HTMLElement)) return true;

  if (target instanceof HTMLTextAreaElement) return true;
  if (target.isContentEditable) return true;
  if (target.closest('[contenteditable="true"]')) return true;
  if (target.closest('.page-toolbar, [data-slot="sheet-content"], [role="dialog"]')) return true;
  if (target.closest('button[role="combobox"]')) return true;

  if (target instanceof HTMLButtonElement && target.type !== 'submit') return true;

  return false;
}

export function shouldIgnoreFormDeleteShortcut(event: KeyboardEvent): boolean {
  if (event.defaultPrevented) return true;
  if (event.isComposing) return true;
  if (hasOpenOverlay()) return true;
  if (isFormFieldFocused(event.target)) return true;

  return false;
}
