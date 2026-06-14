import api from '@/lib/axios';

export interface PlatformCentralUser {
  id: number;
  name: string;
  email: string;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface UpdateCentralUserPayload {
  name: string;
  email: string;
  is_active: boolean;
  password?: string;
  password_confirmation?: string;
}

export const centralUsersService = {
  list: () =>
    api.get<{ status: number; result: { data: PlatformCentralUser[] } }>(
      '/central/v1/admin/central-users',
    ),

  show: (id: number) =>
    api.get<{ status: number; result: PlatformCentralUser }>(
      `/central/v1/admin/central-users/${id}`,
    ),

  update: (id: number, payload: UpdateCentralUserPayload) =>
    api.put<{ status: number; result: PlatformCentralUser }>(
      `/central/v1/admin/central-users/${id}`,
      payload,
    ),

  toggleActive: (id: number, isActive: boolean) =>
    api.patch<{ status: number; result: PlatformCentralUser }>(
      `/central/v1/admin/central-users/${id}/toggle-active`,
      { is_active: isActive },
    ),

  toggleSuperAdmin: (id: number) =>
    api.patch<{ status: number; result: { id: number; is_super_admin: boolean } }>(
      `/central/v1/admin/central-users/${id}/toggle-super-admin`,
    ),
};
