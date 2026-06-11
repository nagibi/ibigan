import type { FieldErrors, FieldValues, Path, UseFormReturn } from 'react-hook-form';

function getFirstErrorPath(errors: FieldErrors, prefix = ''): string | null {
  for (const key of Object.keys(errors)) {
    const value = errors[key];
    if (!value) continue;

    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && 'message' in value && value.message) {
      return path;
    }

    if (typeof value === 'object' && value !== null) {
      const nested = getFirstErrorPath(value as FieldErrors, path);
      if (nested) return nested;
    }
  }

  return null;
}

export function focusFirstFormError<T extends FieldValues>(
  form: Pick<UseFormReturn<T>, 'formState' | 'setFocus'>,
) {
  const path = getFirstErrorPath(form.formState.errors);
  if (!path) return;

  form.setFocus(path as Path<T>);

  requestAnimationFrame(() => {
    const field = document.querySelector<HTMLElement>(
      `[name="${path}"], #${CSS.escape(path)}`,
    );
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

export function validateFormWithFocus<T extends FieldValues>(
  form: UseFormReturn<T>,
): Promise<boolean> {
  return new Promise((resolve) => {
    form.handleSubmit(
      () => resolve(true),
      () => {
        focusFirstFormError(form);
        resolve(false);
      },
    )();
  });
}
