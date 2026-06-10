import api from '@/lib/axios';

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
    const status = columnFilters?.status?.trim() || 'pending';

    return api.get<UserApprovalsPaginatedResponse>('/v1/user-approvals', {
      params: {
        page,
        per_page: perPage,
        status,
      },
    });
  },

  approve: (id: number) =>
    api.patch(`/v1/user-approvals/${id}/approve`),

  reject: (id: number, reason?: string) =>
    api.patch(`/v1/user-approvals/${id}/reject`, { reason }),
};
