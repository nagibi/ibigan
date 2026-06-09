import api from '@/lib/axios';

export interface MessageTemplate {
  id: number;
  name: string;
  slug: string;
  subject: string;
  body: string;
  merge_tags: string[] | null;
  is_active: boolean;
  created_at: string;
}

export type MessageChannel = 'email' | 'sms' | 'whatsapp' | 'notification';

export interface MessageTemplatesPaginatedResponse {
  status: number;
  result: {
    data: MessageTemplate[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export const messageTemplatesService = {
  list: (page = 1) =>
    api.get<MessageTemplatesPaginatedResponse>('/v1/message-templates', { params: { page } }),

  show: (id: number) =>
    api.get<{ status: number; result: MessageTemplate }>(`/v1/message-templates/${id}`),

  store: (payload: Omit<MessageTemplate, 'id' | 'created_at'>) =>
    api.post<{ status: number; result: MessageTemplate }>('/v1/message-templates', payload),

  update: (id: number, payload: Partial<Omit<MessageTemplate, 'id' | 'created_at'>>) =>
    api.put<{ status: number; result: MessageTemplate }>(`/v1/message-templates/${id}`, payload),

  destroy: (id: number) =>
    api.delete(`/v1/message-templates/${id}`),

  duplicate: (id: number) =>
    api.post<{ status: number; result: MessageTemplate }>(
      `/v1/message-templates/${id}/duplicate`,
    ),

  send: (id: number, payload: {
    recipients: string[];
    channels: MessageChannel[];
    data?: Record<string, string>;
  }) => api.post(`/v1/message-templates/${id}/send`, payload),
};