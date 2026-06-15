import { useParams } from 'react-router-dom';
import { VIEW_PREFERENCE_KEYS } from '@/types/view-mode';
import { createCentralTranslationsService } from '@/services/central-translations.service';

export function useTranslationAdminContext() {
  const { tenantId } = useParams<{ tenantId: string }>();

  const translationsApi = tenantId ? createCentralTranslationsService(tenantId) : null;

  return {
    tenantId,
    listPath: tenantId ? `/admin/translations/${tenantId}` : '/admin/translations',
    newPath: tenantId ? `/admin/translations/${tenantId}/new` : '/admin/translations',
    getEditPath: (id: number) => (
      tenantId ? `/admin/translations/${tenantId}/${id}` : '/admin/translations'
    ),
    translationsApi: translationsApi ?? {
      manage: async () => Promise.reject(new Error('unavailable')),
      store: async () => Promise.reject(new Error('unavailable')),
      update: async () => Promise.reject(new Error('unavailable')),
    },
    canManage: Boolean(tenantId && translationsApi),
    gridColumnsKey: 'grid-columns:central-translations',
    viewPreferenceKey: VIEW_PREFERENCE_KEYS.centralTranslations,
  };
}
