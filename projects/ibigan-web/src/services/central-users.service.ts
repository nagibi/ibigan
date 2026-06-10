import api from '@/lib/axios';

export interface PlatformCentralUser {
  id: number;
  name: string;
  email: string;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export const centralUsersService = {
  list: () =>
    api.get<{ status: number; result: { data: PlatformCentralUser[] } }>(
      '/central/v1/admin/central-users',
    ),

  toggleSuperAdmin: (id: number) =>
    api.patch<{ status: number; result: { id: number; is_super_admin: boolean } }>(
      `/central/v1/admin/central-users/${id}/toggle-super-admin`,
    ),
};
