import { z } from 'zod';

export function zRequiredString(label: string, maxLength?: number) {
  let schema = z.string().trim().min(1, `${label} é obrigatório.`);

  if (maxLength) {
    schema = schema.max(maxLength, `Máximo de ${maxLength} caracteres.`);
  }

  return schema;
}

export function zRequiredId(label: string) {
  return z
    .number({ invalid_type_error: `${label} é obrigatório.` })
    .min(1, `${label} é obrigatório.`);
}

/** ID de Select controlado como string (react-hook-form + Radix). */
export function zRequiredSelectId(label: string) {
  return z
    .string()
    .min(1, `${label} é obrigatório.`)
    .refine((value) => Number(value) > 0, `${label} é obrigatório.`);
}

export function zOptionalEmail(maxLength = 255) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .refine((value) => !value || z.string().email().safeParse(value).success, 'E-mail inválido.');
}

export function mapZodFieldErrors(error: z.ZodError): Record<string, string> {
  const record: Record<string, string> = {};

  error.issues.forEach((issue) => {
    const field = issue.path[0];
    if (typeof field !== 'string' || record[field]) return;
    record[field] = issue.message;
  });

  return record;
}
