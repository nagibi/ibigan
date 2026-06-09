import api from '@/lib/axios';

export interface Invite {
  id: number;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface InvitesPaginatedResponse {
  status: number;
  result: {
    data: Invite[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export const invitesService = {
  list: (page = 1) =>
    api.get<InvitesPaginatedResponse>('/v1/invites', { params: { page } }),

  store: (payload: { email: string; role: string }) =>
    api.post<{ status: number; result: Invite }>('/v1/invites', payload),

  destroy: (id: number) =>
    api.delete(`/v1/invites/${id}`),

  accept: (payload: {
    token: string;
    name: string;
    password: string;
    password_confirmation: string;
  }, tenantId: string) =>
    api.post('/v1/invites/accept', payload, {
      headers: { 'X-Tenant-ID': tenantId },
    }),
};