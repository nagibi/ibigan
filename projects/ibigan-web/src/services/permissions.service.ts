import api from '@/lib/axios';

export interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
}

export const permissionsService = {
  list: () =>
    api.get<{ status: number; result: Permission[] }>('/v1/permissions'),

  show: (id: number) =>
    api.get<{ status: number; result: Permission }>(`/v1/permissions/${id}`),

  store: (payload: { name: string }) =>
    api.post<{ status: number; result: Permission }>('/v1/permissions', payload),

  update: (id: number, payload: { name: string }) =>
    api.put<{ status: number; result: Permission }>(`/v1/permissions/${id}`, payload),

  destroy: (id: number) =>
    api.delete(`/v1/permissions/${id}`),
};
