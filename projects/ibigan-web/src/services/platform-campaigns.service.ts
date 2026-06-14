import api from '@/lib/axios';
import type { CampaignRecipient, StoreCampaignPayload } from '@/services/campaigns.service';

export interface StorePlatformCampaignPayload extends StoreCampaignPayload {
  tenant_ids: string[];
  template_slug?: string | null;
}

export const platformCampaignsService = {
  store: (payload: StorePlatformCampaignPayload) =>
    api.post<{
      status: number;
      result: {
        dispatched: Array<{ tenant_id: string; campaign_id: number; status: string }>;
        skipped: Array<{ tenant_id: string; reason: string }>;
      };
    }>('/central/v1/admin/platform/campaigns', payload),
};

export type { CampaignRecipient };
