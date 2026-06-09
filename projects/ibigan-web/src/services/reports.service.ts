import api from '@/lib/axios';

export interface ReportParameter {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  label: string;
  required: boolean;
  options?: string[];
}

export interface ReportColumn {
  key: string;
  label: string;
  format: 'text' | 'number' | 'datetime' | 'date' | 'currency' | 'boolean';
}

export interface ReportTemplate {
  id: number;
  name: string;
  description: string | null;
  query: string | null;
  parameters: ReportParameter[] | null;
  columns: ReportColumn[] | null;
  is_active: boolean;
  created_at: string;
}

export interface ReportExecution {
  id: number;
  executed_by: string;
  parameters: Record<string, string> | null;
  rows_count: number;
  duration_ms: number;
  status: 'success' | 'error';
  error_message: string | null;
  executed_at: string;
}

export interface MyReportExecution {
  id: number;
  template_id: number;
  template_name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress_message: string | null;
  rows_count: number;
  duration_ms: number;
  error_message: string | null;
  expires_at: string | null;
  executed_at: string;
  parameters: Record<string, string> | null;
}

export type StoreReportPayload = Omit<ReportTemplate, 'id' | 'created_at'>;

export const reportsService = {
  list: (page = 1) =>
    api.get<{ status: number; result: { data: ReportTemplate[]; meta: { total: number; current_page: number; last_page: number } } }>(
      '/v1/reports', { params: { page } },
    ),

  show: (id: number) =>
    api.get<{ status: number; result: ReportTemplate }>(`/v1/reports/${id}`),

  store: (payload: StoreReportPayload) =>
    api.post<{ status: number; result: ReportTemplate }>('/v1/reports', payload),

  update: (id: number, payload: Partial<StoreReportPayload>) =>
    api.put<{ status: number; result: ReportTemplate }>(`/v1/reports/${id}`, payload),

  destroy: (id: number) =>
    api.delete(`/v1/reports/${id}`),

  toggleActive: (id: number, isActive: boolean) =>
    api.patch<{ status: number; result: ReportTemplate }>(
      `/v1/reports/${id}/toggle-active`,
      { is_active: isActive },
    ),

  execute: (id: number, parameters: Record<string, string>) =>
    api.post<{ status: number; result: { rows: Record<string, unknown>[]; count: number; duration: number } }>(
      `/v1/reports/${id}/execute`, { parameters },
    ),

  executions: (id: number) =>
    api.get<{ status: number; result: { data: ReportExecution[]; meta: { total: number } } }>(
      `/v1/reports/${id}/executions`,
    ),

  myExecutions: () =>
    api.get<{ status: number; result: { data: MyReportExecution[]; meta: { total: number; current_page: number; last_page: number } } }>(
      '/v1/reports/executions/my',
    ),

  executionStatus: (reportId: number, executionId: number) =>
    api.get<{ status: number; result: {
      id: number;
      status: string;
      progress_message: string | null;
      rows_count: number;
      duration_ms: number;
      error_message: string | null;
      expires_at: string | null;
    } }>(`/v1/reports/${reportId}/executions/${executionId}/status`),

  result: (reportId: number, executionId: number, page = 1, perPage = 50) =>
    api.get<{ status: number; result: { data: Record<string, unknown>[]; meta: { total: number; current_page: number; last_page: number } } }>(
      `/v1/reports/${reportId}/executions/${executionId}/result`,
      { params: { page, per_page: perPage } },
    ),
};

export async function downloadReportResultCsv(
  reportId: number,
  executionId: number,
  fileName: string,
  columns?: ReportColumn[] | null,
) {
  const { data } = await reportsService.result(reportId, executionId, 1, 10000);
  const rows = data.result.data;
  if (rows.length === 0) return;

  const cols = columns?.length
    ? columns
    : Object.keys(rows[0]).map((k) => ({ key: k, label: k, format: 'text' as const }));

  const header = cols.map((c) => c.label).join(',');
  const csvRows = rows.map((row) =>
    cols.map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(','),
  );
  const csv = [header, ...csvRows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
