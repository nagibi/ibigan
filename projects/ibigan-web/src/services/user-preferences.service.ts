import api from '@/lib/axios';

export type UserPreferencesMap = Record<string, string>;

export const userPreferencesService = {
  get: () =>
    api.get<{ status: number; result: UserPreferencesMap }>('/v1/user-preferences'),

  update: (preferences: UserPreferencesMap) =>
    api.patch<{ status: number; result: UserPreferencesMap }>('/v1/user-preferences', {
      preferences,
    }),
};
