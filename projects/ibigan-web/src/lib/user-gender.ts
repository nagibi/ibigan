import i18n from '@/i18n/i18next';

export const USER_GENDER_VALUES = [
  'male',
  'female',
  'other',
  'prefer_not_to_say',
] as const;

export type UserGender = (typeof USER_GENDER_VALUES)[number];

export function getUserGenderLabel(gender: UserGender): string {
  return i18n.t(`users.gender.${gender}`);
}

export function getUserGenderOptions() {
  return USER_GENDER_VALUES.map((value) => ({
    value,
    label: getUserGenderLabel(value),
  }));
}

export function formatUserGender(gender?: string | null): string {
  if (!gender) return '—';

  if (USER_GENDER_VALUES.includes(gender as UserGender)) {
    return getUserGenderLabel(gender as UserGender);
  }

  return gender;
}
