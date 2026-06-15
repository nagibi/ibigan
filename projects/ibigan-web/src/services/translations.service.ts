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
};
