import api from '@/lib/axios';

export interface Role {
  id: number;
  name: string;
  is_system: boolean;
  permissions_locked: boolean;
  permissions: string[];
  users_count: number;
  created_at: string;
  updated_at: string | null;
}

export const rolesService = {
  list: () =>
    api.get<{ status: number; result: Role[] }>('/v1/roles'),

  show: (id: number) =>
    api.get<{ status: number; result: Role }>(`/v1/roles/${id}`),

  store: (payload: { name: string; permissions?: string[] }) =>
    api.post<{ status: number; result: Role }>('/v1/roles', payload),

  update: (id: number, payload: { name: string }) =>
    api.put<{ status: number; result: Role }>(`/v1/roles/${id}`, payload),

  syncPermissions: (id: number, permissions: string[]) =>
    api.put<{ status: number; result: Role }>(`/v1/roles/${id}/permissions`, { permissions }),

  destroy: (id: number) =>
    api.delete(`/v1/roles/${id}`),
};
