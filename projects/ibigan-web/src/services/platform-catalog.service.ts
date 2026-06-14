import api from '@/lib/axios';
import { parseMultiFilterValue } from '@/components/grid/grid-multi-value-filter';
import type { MessageTemplate } from '@/services/message-templates.service';
import type { ReportTemplate } from '@/services/reports.service';

type PaginatedMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

function buildListParams(
  page: number,
  perPage: number,
  search?: string,
  sort?: string | null,
  direction?: 'asc' | 'desc',
  columnFilters?: Record<string, string>,
) {
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

  return params;
}

export const platformCatalogMessageTemplatesService = {
  list: (
    page = 1,
    perPage = 15,
    search?: string,
    sort?: string | null,
    direction?: 'asc' | 'desc',
    columnFilters?: Record<string, string>,
  ) =>
    api.get<{ status: number; result: { data: MessageTemplate[]; meta: PaginatedMeta } }>(
      '/central/v1/admin/platform/message-templates',
      { params: buildListParams(page, perPage, search, sort, direction, columnFilters) },
    ),

  show: (id: number) =>
    api.get<{ status: number; result: MessageTemplate }>(
      `/central/v1/admin/platform/message-templates/${id}`,
    ),

  update: (id: number, payload: Partial<Pick<MessageTemplate, 'name' | 'subject' | 'body' | 'merge_tags' | 'is_active'>>) =>
    api.put<{ status: number; result: MessageTemplate }>(
      `/central/v1/admin/platform/message-templates/${id}`,
      payload,
    ),

  toggleActive: (id: number, isActive: boolean) =>
    api.patch<{ status: number; result: MessageTemplate }>(
      `/central/v1/admin/platform/message-templates/${id}/toggle-active`,
      { is_active: isActive },
    ),

  sync: () =>
    api.post<{ status: number; result: { tenants_synced: number } }>(
      '/central/v1/admin/platform-catalog/sync',
    ),
};

export const platformCatalogReportsService = {
  list: (
    page = 1,
    perPage = 15,
    search?: string,
    sort?: string | null,
    direction?: 'asc' | 'desc',
    columnFilters?: Record<string, string>,
  ) =>
    api.get<{ status: number; result: { data: ReportTemplate[]; meta: PaginatedMeta } }>(
      '/central/v1/admin/platform/report-templates',
      { params: buildListParams(page, perPage, search, sort, direction, columnFilters) },
    ),

  show: (id: number) =>
    api.get<{ status: number; result: ReportTemplate }>(
      `/central/v1/admin/platform/report-templates/${id}`,
    ),

  update: (
    id: number,
    payload: Partial<Pick<ReportTemplate, 'name' | 'description' | 'query' | 'parameters' | 'columns' | 'is_active'>>,
  ) =>
    api.put<{ status: number; result: ReportTemplate }>(
      `/central/v1/admin/platform/report-templates/${id}`,
      payload,
    ),

  toggleActive: (id: number, isActive: boolean) =>
    api.patch<{ status: number; result: ReportTemplate }>(
      `/central/v1/admin/platform/report-templates/${id}/toggle-active`,
      { is_active: isActive },
    ),
};
