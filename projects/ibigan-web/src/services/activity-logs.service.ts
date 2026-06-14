import api from '@/lib/axios';

export interface ActivityLog {
  id: number;
  log_name: string;
  description: string;
  subject_type: string;
  subject_id: number;
  causer_type: string | null;
  causer_id: number | null;
  causer_name: string | null;
  properties: Record<string, unknown>;
  created_at: string;
}

export const activityLogsService = {
  list: (page = 1, filters?: {
    per_page?: number;
    log_name?: string;
    subject_type?: string;
    causer_id?: number;
    date_from?: string;
    date_to?: string;
    filter_id?: string;
  }) =>
    api.get<{ status: number; result: { data: ActivityLog[]; meta: { total: number; current_page: number; last_page: number; per_page: number } } }>(
      '/v1/activity-logs', { params: { page, ...filters } },
    ),

  forSubject: (type: string, id: number) =>
    api.get<{ status: number; result: { data: ActivityLog[]; meta: { total: number } } }>(
      `/v1/activity-logs/${type}/${id}`,
    ),
};
