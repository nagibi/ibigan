import api from '@/lib/axios';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import type { ActivityLog } from '@/services/activity-logs.service';

export interface AdminTenant {
  id: string;
  name: string | null;
  slug: string;
  cnpj: string | null;
  timezone: string;
  locale: string;
  is_active: boolean;
  require_admin_approval: boolean;
  users_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminTenantsPaginatedResponse {
  status: number;
  result: {
    data: AdminTenant[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export interface StoreAdminTenantPayload {
  name: string;
  cnpj?: string | null;
  timezone?: string;
  locale?: string;
  is_active?: boolean;
  require_admin_approval?: boolean;
}

export interface UpdateAdminTenantPayload {
  name?: string;
  cnpj?: string | null;
  timezone?: string;
  locale?: string;
  is_active?: boolean;
  require_admin_approval?: boolean;
}

export const adminTenantsService = {
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

    return api.get<AdminTenantsPaginatedResponse>('/central/v1/admin/tenants', { params });
  },

  show: (id: string) =>
    api.get<{ status: number; result: AdminTenant }>(`/central/v1/admin/tenants/${id}`),

  store: (payload: StoreAdminTenantPayload) =>
    api.post<{ status: number; result: AdminTenant }>(
      '/central/v1/admin/tenants',
      payload,
    ),

  update: (id: string, payload: UpdateAdminTenantPayload) =>
    api.put<{ status: number; result: AdminTenant }>(
      `/central/v1/admin/tenants/${id}`,
      payload,
    ),

  toggleActive: (id: string, isActive: boolean) =>
    api.patch<{ status: number; result: AdminTenant }>(
      `/central/v1/admin/tenants/${id}/toggle-active`,
      { is_active: isActive },
    ),

  destroy: (id: string) => api.delete(`/central/v1/admin/tenants/${id}`),

  activityLogs: (tenantId: string, page = 1, perPage = 50) =>
    api.get<{
      status: number;
      result: { data: ActivityLog[]; meta: { total: number; current_page: number; last_page: number; per_page: number } };
    }>(`/central/v1/admin/tenants/${tenantId}/activity-logs`, {
      params: { page, per_page: perPage },
    }),

  impersonate: (tenantId: string) =>
    api.post<{
      status: number;
      result: {
        token: string;
        tenant_id: string;
        user: {
          id: number;
          name: string;
          email: string;
          is_platform_user: boolean;
          roles: string[];
          permissions: string[];
        };
      };
    }>(`/central/v1/admin/tenants/${tenantId}/impersonate`),
};
