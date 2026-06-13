import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

type ApiValidationErrors = Record<string, string[]>;

type ApiFieldError = {
  field?: string;
  message?: string;
};

const API_FIELD_MESSAGE_MAP: Record<string, string> = {
  'The email has already been taken.': 'Este e-mail já está em uso.',
  'The password field must contain at least one number.': 'A senha deve conter pelo menos um número.',
  'The password field must be at least 8 characters.': 'A senha deve ter pelo menos 8 caracteres.',
  'The password field confirmation does not match.': 'As senhas não coincidem.',
};

function translateApiFieldMessage(message: string) {
  return API_FIELD_MESSAGE_MAP[message] ?? message;
}

function normalizeApiValidationErrors(errors: unknown): ApiValidationErrors | null {
  if (!errors) {
    return null;
  }

  if (Array.isArray(errors)) {
    const map: ApiValidationErrors = {};

    errors.forEach((item) => {
      const fieldError = item as ApiFieldError;
      const field = fieldError.field?.trim();
      const message = fieldError.message?.trim();

      if (!field || !message) {
        return;
      }

      map[field] = [message];
    });

    return Object.keys(map).length > 0 ? map : null;
  }

  if (typeof errors === 'object') {
    const entries = Object.entries(errors as ApiValidationErrors).filter(
      ([, messages]) => Array.isArray(messages) && messages.length > 0,
    );

    return entries.length > 0 ? Object.fromEntries(entries) : null;
  }

  return null;
}

export function getApiValidationErrors(error: unknown): ApiValidationErrors | null {
  const errors = (error as { response?: { data?: { errors?: unknown } } })
    ?.response?.data?.errors;

  return normalizeApiValidationErrors(errors);
}

export function applyApiFormErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  error: unknown,
): boolean {
  const apiErrors = getApiValidationErrors(error);

  if (!apiErrors) return false;

  Object.entries(apiErrors).forEach(([field, messages]) => {
    const message = messages[0];
    if (!message) return;

    form.setError(field as Path<T>, {
      type: 'server',
      message: translateApiFieldMessage(message),
    });
  });

  return true;
}
