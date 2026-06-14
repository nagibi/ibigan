import { useLocation } from 'react-router-dom';
import { campaignsService } from '@/services/campaigns.service';
import { platformCampaignsService } from '@/services/platform-campaigns.service';
import { messageTemplatesService } from '@/services/message-templates.service';
import { platformCatalogMessageTemplatesService } from '@/services/platform-catalog.service';

export function useCampaignContext() {
  const { pathname } = useLocation();
  const isCentralDispatch = pathname === '/admin/campaigns'
    || pathname === '/admin/campaigns/new'
    || pathname.startsWith('/admin/campaigns/');

  return {
    isCentralDispatch,
    listPath: isCentralDispatch ? '/admin/campaigns' : '/campaigns',
    newPath: isCentralDispatch ? '/admin/campaigns/new' : '/campaigns/new',
    getEditPath: (id: number) => (isCentralDispatch ? `/admin/campaigns/${id}` : `/campaigns/${id}/edit`),
    getDetailPath: (id: number) => (isCentralDispatch ? `/admin/campaigns/${id}` : `/campaigns/${id}`),
    campaignsApi: isCentralDispatch ? platformCampaignsService : campaignsService,
    templatesApi: isCentralDispatch ? platformCatalogMessageTemplatesService : messageTemplatesService,
  };
}
