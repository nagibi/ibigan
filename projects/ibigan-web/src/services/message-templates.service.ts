import api from '@/lib/axios';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';

export interface MessageTemplate {
  id: number;
  name: string;
  slug: string;
  subject: string;
  body: string;
  merge_tags: string[] | null;
  is_active: boolean;
  is_system: boolean;
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
  list: (
    page = 1,
    perPage = 15,
    search?: string,
    sort?: string | null,
    direction?: 'asc' | 'desc',
    columnFilters?: Record<string, string>,
  ) => {
    const params: Record<string, string | number> = { page, per_page: perPage };

    if (search?.trim()) params.search = search.trim();
    if (sort) {
      params.sort = sort;
      params.direction = direction ?? 'asc';
    }

    for (const [key, value] of Object.entries(columnFilters ?? {})) {
      if (!value.trim()) continue;

      if (key === 'status') {
        const values = parseMultiFilterValue(value);
        if (values.length === 1) {
          params.is_active = values[0] === 'active' ? '1' : '0';
        }
        continue;
      }

      params[`filter_${key}`] = value;
    }

    return api.get<MessageTemplatesPaginatedResponse>('/v1/message-templates', { params });
  },

  show: (id: number) =>
    api.get<{ status: number; result: MessageTemplate }>(`/v1/message-templates/${id}`),

  store: (payload: Omit<MessageTemplate, 'id' | 'created_at'>) =>
    api.post<{ status: number; result: MessageTemplate }>('/v1/message-templates', payload),

  update: (id: number, payload: Partial<Omit<MessageTemplate, 'id' | 'created_at'>>) =>
    api.put<{ status: number; result: MessageTemplate }>(`/v1/message-templates/${id}`, payload),

  destroy: (id: number) =>
    api.delete(`/v1/message-templates/${id}`),

  toggleActive: (id: number, isActive: boolean) =>
    api.patch<{ status: number; result: MessageTemplate }>(
      `/v1/message-templates/${id}/toggle-active`,
      { is_active: isActive },
    ),

  duplicate: (id: number) =>
    api.post<{ status: number; result: MessageTemplate }>(
      `/v1/message-templates/${id}/duplicate`,
    ),

  testSend: (id: number, channels?: MessageChannel[]) =>
    api.post<{ status: number; result: { queued: number; recipient: string } }>(
      `/v1/message-templates/${id}/test-send`,
      channels ? { channels } : {},
    ),

  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('image', file);
    return api.post<{ status: number; result: { url: string } }>(
      '/v1/message-templates/upload-image',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  },
};