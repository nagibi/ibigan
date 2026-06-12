export const USER_GENDER_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: 'other', label: 'Outro' },
  { value: 'prefer_not_to_say', label: 'Prefiro não informar' },
] as const;

export type UserGender = (typeof USER_GENDER_OPTIONS)[number]['value'];

export function formatUserGender(gender?: string | null): string {
  if (!gender) return '—';
  return USER_GENDER_OPTIONS.find((option) => option.value === gender)?.label ?? gender;
}
