import api from '@/lib/axios';

export interface TenantTranslation {
  id: number;
  key: string;
  locale: string;
  value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TranslationOverridesResponse {
  status: number;
  result: {
    locale: string;
    overrides: Record<string, string>;
  };
}

export interface TranslationManageFilters {
  locale?: string;
  search?: string;
}

export const translationsService = {
  overrides: (locale: string) =>
    api.get<TranslationOverridesResponse>('/v1/translations', { params: { locale } }),

  manage: (filters: TranslationManageFilters = {}) =>
    api.get<{ status: number; result: TenantTranslation[] }>('/v1/translations/manage', {
      params: filters,
    }),

  store: (payload: Omit<TenantTranslation, 'id' | 'created_at' | 'updated_at'>) =>
    api.post<{ status: number; result: TenantTranslation; message_code: string; severity?: string }>(
      '/v1/translations',
      payload,
    ),

  update: (id: number, payload: Partial<Omit<TenantTranslation, 'id' | 'created_at' | 'updated_at'>>) =>
    api.put<{ status: number; result: TenantTranslation; message_code: string; severity?: string }>(
      `/v1/translations/${id}`,
      payload,
    ),
};
