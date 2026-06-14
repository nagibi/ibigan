import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
  platformCatalogMessageTemplatesService,
  platformCatalogReportsService,
} from '@/services/platform-catalog.service';
import { messageTemplatesService } from '@/services/message-templates.service';
import { reportsService } from '@/services/reports.service';

export function isCentralCatalogPath(pathname: string): boolean {
  return (
    pathname === '/admin/message-templates'
    || pathname.startsWith('/admin/message-templates/')
    || pathname === '/admin/reports'
    || pathname.startsWith('/admin/reports/')
  );
}

export function usePlatformCatalogMode() {
  const { pathname } = useLocation();

  return useMemo(() => {
    const isPlatformCatalog = isCentralCatalogPath(pathname);

    return {
      isPlatformCatalog,
      messageTemplates: {
        listPath: isPlatformCatalog ? '/admin/message-templates' : '/message-templates',
        getEditPath: (id: number | string) =>
          isPlatformCatalog
            ? `/admin/message-templates/${id}`
            : `/message-templates/${id}`,
        service: isPlatformCatalog ? platformCatalogMessageTemplatesService : messageTemplatesService,
        gridColumnsKey: isPlatformCatalog
          ? 'grid-columns:platform-message-templates'
          : 'grid-columns:message-templates',
        viewPreferenceKey: isPlatformCatalog ? 'platformMessageTemplates' : 'messageTemplates',
      },
      reports: {
        listPath: isPlatformCatalog ? '/admin/reports' : '/reports',
        getEditPath: (id: number | string) =>
          isPlatformCatalog ? `/admin/reports/${id}` : `/reports/${id}`,
        service: isPlatformCatalog ? platformCatalogReportsService : reportsService,
        gridColumnsKey: isPlatformCatalog ? 'grid-columns:platform-reports' : 'grid-columns:reports',
        viewPreferenceKey: isPlatformCatalog ? 'platformReports' : 'reports',
      },
    };
  }, [pathname]);
}
