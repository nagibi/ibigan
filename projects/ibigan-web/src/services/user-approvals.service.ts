import api from '@/lib/axios';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';

export interface UserApproval {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface UserApprovalsPaginatedResponse {
  status: number;
  result: {
    data: UserApproval[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export const userApprovalsService = {
  list: (
    page = 1,
    perPage = 15,
    columnFilters?: Record<string, string>,
  ) => {
    const statusFilter = columnFilters?.status?.trim();
    const statuses = statusFilter ? parseMultiFilterValue(statusFilter) : [];
    const params: Record<string, string | number> = {
      page,
      per_page: perPage,
    };

    if (statuses.length > 0) {
      params.status = statuses.join(',');
    } else {
      params.status = 'pending';
    }

    return api.get<UserApprovalsPaginatedResponse>('/v1/user-approvals', { params });
  },

  approve: (id: number) =>
    api.patch(`/v1/user-approvals/${id}/approve`),

  reject: (id: number, reason?: string) =>
    api.patch(`/v1/user-approvals/${id}/reject`, { reason }),
};
