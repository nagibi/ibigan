import api from '@/lib/axios';

export interface TenantSettings {
  id: string;
  name: string | null;
  slug: string;
  timezone: string;
  locale: string;
  logo_url: string | null;
  created_at: string;
}

export const tenantSettingsService = {
  show: () =>
    api.get<{ status: number; result: TenantSettings }>('/v1/tenant/settings'),

  update: (payload: { name?: string; timezone?: string; locale?: string }) =>
    api.put<{ status: number; result: TenantSettings }>('/v1/tenant/settings', payload),

  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return api.post<{ status: number; result: TenantSettings }>('/v1/tenant/settings/logo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteLogo: () =>
    api.delete('/v1/tenant/settings/logo'),
};
