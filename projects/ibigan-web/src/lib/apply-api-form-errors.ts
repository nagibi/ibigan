import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

type ApiValidationErrors = Record<string, string[]>;

const API_FIELD_MESSAGE_MAP: Record<string, string> = {
  'The email has already been taken.': 'Este e-mail já está em uso.',
  'The password field must contain at least one number.': 'A senha deve conter pelo menos um número.',
  'The password field must be at least 8 characters.': 'A senha deve ter pelo menos 8 caracteres.',
  'The password field confirmation does not match.': 'As senhas não coincidem.',
};

function translateApiFieldMessage(message: string) {
  return API_FIELD_MESSAGE_MAP[message] ?? message;
}

export function getApiValidationErrors(error: unknown): ApiValidationErrors | null {
  const errors = (error as { response?: { data?: { errors?: ApiValidationErrors } } })
    ?.response?.data?.errors;

  if (!errors || typeof errors !== 'object') return null;

  const entries = Object.entries(errors).filter(
    ([, messages]) => Array.isArray(messages) && messages.length > 0,
  );

  return entries.length > 0 ? Object.fromEntries(entries) : null;
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
