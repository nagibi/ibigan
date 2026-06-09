import api from '@/lib/axios';

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

export const WEBHOOK_EVENTS = [
  { value: 'user.created', label: 'Usuário criado' },
  { value: 'user.updated', label: 'Usuário atualizado' },
  { value: 'user.deleted', label: 'Usuário removido' },
  { value: 'organization.created', label: 'Organização criada' },
  { value: 'organization.updated', label: 'Organização atualizada' },
  { value: 'organization.deleted', label: 'Organização removida' },
  { value: 'invite.accepted', label: 'Convite aceito' },
];

export const webhooksService = {
  list: (page = 1) =>
    api.get<{ status: number; result: { data: Webhook[]; meta: { total: number; current_page: number; last_page: number } } }>(
      '/v1/webhooks', { params: { page } },
    ),

  show: (id: number) =>
    api.get<{ status: number; result: Webhook }>(`/v1/webhooks/${id}`),

  store: (payload: { url: string; events: string[]; is_active?: boolean; secret?: string }) =>
    api.post<{ status: number; result: Webhook }>('/v1/webhooks', payload),

  update: (id: number, payload: Partial<{ url: string; events: string[]; is_active: boolean; secret: string }>) =>
    api.put<{ status: number; result: Webhook }>(`/v1/webhooks/${id}`, payload),

  destroy: (id: number) =>
    api.delete(`/v1/webhooks/${id}`),

  deliveries: (id: number, page = 1) =>
    api.get<{ status: number; result: { data: WebhookDelivery[]; meta: { total: number; current_page: number; last_page: number } } }>(
      `/v1/webhooks/${id}/deliveries`, { params: { page } },
    ),
};
