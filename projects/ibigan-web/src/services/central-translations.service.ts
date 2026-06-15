import api from '@/lib/axios';
import type { TenantTranslation } from '@/services/translations.service';

export function createCentralTranslationsService(tenantId: string) {
  const basePath = `/central/v1/admin/tenants/${tenantId}/translations`;

  return {
    manage: (params?: { locale?: string; search?: string }) =>
      api.get<{ status: number; result: TenantTranslation[] }>(basePath, { params }),

    store: (payload: Pick<TenantTranslation, 'key' | 'locale' | 'value' | 'is_active'>) =>
      api.post<{ status: number; result: TenantTranslation; message_code: string }>(basePath, payload),

    update: (id: number, payload: Partial<Pick<TenantTranslation, 'key' | 'locale' | 'value' | 'is_active'>>) =>
      api.put<{ status: number; result: TenantTranslation; message_code: string }>(`${basePath}/${id}`, payload),
  };
}
