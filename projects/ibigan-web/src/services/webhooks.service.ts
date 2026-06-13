import api from '@/lib/axios';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';

export interface Webhook {
  id: number;
  url: string;
  events: string[];
  is_active: boolean;
  secret: string | null;
  description?: string | null;
  created_at: string;
}

export interface WebhookDelivery {
  id: number;
  event: string;
  status: 'success' | 'failed' | string;
  response_status: number | null;
  payload: Record<string, unknown>;
  response_body: string | null;
  attempts: number;
  delivered_at: string | null;
  created_at: string;
}

export interface WebhooksPaginatedResponse {
  status: number;
  result: {
    data: Webhook[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export const WEBHOOK_EVENTS = [
  { value: 'user.created', label: 'Usuário criado' },
  { value: 'user.updated', label: 'Usuário atualizado' },
  { value: 'user.deleted', label: 'Usuário removido' },
  { value: 'invite.accepted', label: 'Convite aceito' },
];

export const webhooksService = {
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
          params.filter_is_active = values[0] === 'active' ? '1' : '0';
        }
        continue;
      }

      params[`filter_${key}`] = value;
    }

    return api.get<WebhooksPaginatedResponse>('/v1/webhooks', { params });
  },

  show: (id: number) =>
    api.get<{ status: number; result: Webhook }>(`/v1/webhooks/${id}`),

  store: (payload: { url: string; events: string[]; is_active?: boolean; secret?: string }) =>
    api.post<{ status: number; result: Webhook }>('/v1/webhooks', payload),

  update: (id: number, payload: Partial<{ url: string; events: string[]; is_active: boolean; secret: string }>) =>
    api.put<{ status: number; result: Webhook }>(`/v1/webhooks/${id}`, payload),

  destroy: (id: number) =>
    api.delete(`/v1/webhooks/${id}`),

  toggleActive: (id: number, isActive: boolean) =>
    api.patch<{ status: number; result: Webhook }>(
      `/v1/webhooks/${id}/toggle-active`,
      { is_active: isActive },
    ),

  deliveries: (id: number, page = 1) =>
    api.get<{ status: number; result: { data: WebhookDelivery[]; meta: { total: number; current_page: number; last_page: number } } }>(
      `/v1/webhooks/${id}/deliveries`, { params: { page } },
    ),
};
