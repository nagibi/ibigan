import api from '@/lib/axios';

export interface CampaignRecipient {
  type: 'all' | 'role' | 'permission' | 'organization' | 'user';
  value?: string;
}

export interface Campaign {
  id: number;
  name: string;
  description: string | null;
  template_id: number | null;
  subject: string | null;
  body: string | null;
  channels: string[];
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  type: 'manual' | 'automated' | 'transactional';
  scheduled_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  stats: {
    total: number;
    sent: number;
    failed: number;
    opened: number;
  } | null;
  created_by: number;
  created_at: string;
}

export interface CampaignDelivery {
  id: number;
  campaign_id: number;
  user_id: number | null;
  channel: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed' | 'opened' | 'clicked';
  recipient_email: string | null;
  error_message: string | null;
  queued_at: string | null;
  sent_at: string | null;
  opened_at: string | null;
  created_at: string;
}

export interface StoreCampaignPayload {
  name: string;
  description?: string;
  template_id?: number | null;
  subject?: string;
  body?: string;
  merge_data?: Record<string, string>;
  channels: string[];
  scheduled_at?: string | null;
  recipients: CampaignRecipient[];
}

export const campaignsService = {
  list: (page = 1, status?: string) =>
    api.get<{ status: number; result: { data: Campaign[]; meta: { total: number; current_page: number; last_page: number; per_page: number } } }>(
      '/v1/campaigns', { params: { page, status } },
    ),

  show: (id: number) =>
    api.get<{ status: number; result: Campaign }>(`/v1/campaigns/${id}`),

  store: (payload: StoreCampaignPayload) =>
    api.post<{ status: number; result: Campaign }>('/v1/campaigns', payload),

  update: (id: number, payload: Partial<StoreCampaignPayload>) =>
    api.put<{ status: number; result: Campaign }>(`/v1/campaigns/${id}`, payload),

  destroy: (id: number) =>
    api.delete(`/v1/campaigns/${id}`),

  cancel: (id: number) =>
    api.patch<{ status: number; result: Campaign }>(`/v1/campaigns/${id}/cancel`),

  deliveries: (id: number, page = 1) =>
    api.get<{ status: number; result: { data: CampaignDelivery[]; meta: { total: number; current_page: number; last_page: number } } }>(
      `/v1/campaigns/${id}/deliveries`, { params: { page } },
    ),
};
