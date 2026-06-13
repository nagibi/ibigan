import api from '@/lib/axios';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import { toast } from 'sonner';

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
  executed_by?: string | null;
  parameters: Record<string, string> | null;
  rows_count: number;
  duration_ms: number;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'success' | 'error';
  progress_message?: string | null;
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

export interface ReportsPaginatedResponse {
  status: number;
  result: {
    data: ReportTemplate[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export type StoreReportPayload = Omit<ReportTemplate, 'id' | 'created_at'>;

export const reportsService = {
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
          params.is_active = values[0] === 'active' ? '1' : '0';
        }
        continue;
      }

      params[`filter_${key}`] = value;
    }

    return api.get<ReportsPaginatedResponse>('/v1/reports', { params });
  },

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
    api.post<{ status: number; result: {
      execution_id: number;
      status: 'queued' | 'running' | 'completed' | 'failed';
      progress_message: string | null;
    } }>(
      `/v1/reports/${id}/execute`, { parameters },
    ),

  executions: (id: number) =>
    api.get<{ status: number; result: { data: ReportExecution[]; meta: { total: number } } }>(
      `/v1/reports/${id}/executions`,
    ),

  myExecutions: (page = 1, perPage = 15) =>
    api.get<{ status: number; result: { data: MyReportExecution[]; meta: { total: number; current_page: number; last_page: number; per_page: number } } }>(
      '/v1/reports/executions/my',
      { params: { page, per_page: perPage } },
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

  if (rows.length === 0) {
    throw new Error('Relatório sem dados para exportar.');
  }

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

export async function downloadReportResultCsvWithToast(
  reportId: number,
  executionId: number,
  fileName: string,
  columns?: ReportColumn[] | null,
) {
  try {
    await downloadReportResultCsv(reportId, executionId, fileName, columns);
    toast.success('Download iniciado.', {
      classNames: {
        title: 'text-foreground font-medium',
        icon: '!text-green-600',
      },
    });
  } catch (error) {
    const apiMessage = (error as { response?: { data?: { message_code?: string } } })
      ?.response?.data?.message_code;
    const message = apiMessage === 'report.result_not_found'
      ? 'Arquivo do relatório não encontrado. Execute o relatório novamente.'
      : apiMessage === 'report.result_expired'
        ? 'O resultado deste relatório expirou. Execute novamente.'
        : error instanceof Error
          ? error.message
          : 'Não foi possível baixar o arquivo.';
    toast.error(message);
    throw error;
  }
}
