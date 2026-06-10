import api from '@/lib/axios';

export interface Invite {
  id: number;
  email: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  token?: string;
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
  list: (
    page = 1,
    perPage = 15,
    search?: string,
    sort?: string | null,
    direction?: 'asc' | 'desc',
    columnFilters?: Record<string, string>,
  ) => {
    const filterParams = Object.fromEntries(
      Object.entries(columnFilters ?? {})
        .filter(([, value]) => value.trim().length > 0)
        .map(([key, value]) => [`filter_${key}`, value]),
    );

    return api.get<InvitesPaginatedResponse>('/v1/invites', {
      params: {
        page,
        per_page: perPage,
        ...(search ? { search } : {}),
        ...(sort ? { sort, direction: direction ?? 'asc' } : {}),
        ...filterParams,
      },
    });
  },

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
