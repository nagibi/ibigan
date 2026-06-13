import type { GridColumnDef } from '@/hooks/use-grid-columns';
import { resolveGridColumnLabel } from '@/lib/grid-column-presets';

const DEFAULT_EXCLUDED_COLUMN_IDS = new Set(['select', 'actions']);

function formatExportValue(value: unknown): string {
  if (value == null) return '';

  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }

  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatExportValue(item)).filter(Boolean).join('; ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function resolveRowFieldValue(row: Record<string, unknown>, columnId: string): unknown {
  if (columnId in row) {
    return row[columnId];
  }

  if (columnId === 'active') {
    if ('is_active' in row) return row.is_active;
    if ('status' in row) return row.status;
  }

  return undefined;
}

export function resolveGridExportCellValue<T>(
  column: GridColumnDef<T>,
  row: T,
): string {
  if (column.exportValue) {
    return formatExportValue(column.exportValue(row));
  }

  const record = row as Record<string, unknown>;
  return formatExportValue(resolveRowFieldValue(record, column.id));
}

export function getGridExportColumns<T>(
  columns: GridColumnDef<T>[],
  excludedIds: Set<string> = DEFAULT_EXCLUDED_COLUMN_IDS,
): GridColumnDef<T>[] {
  return columns.filter((column) => !excludedIds.has(column.id));
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function buildCsvContent(headers: string[], rows: string[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(','));
  return `\uFEFF${lines.join('\n')}`;
}

function normalizeExportFilename(filename: string): string {
  const trimmed = filename.trim().replace(/\.csv$/i, '');
  const date = new Date().toISOString().slice(0, 10);
  return `${trimmed}-${date}.csv`;
}

export function exportGridToCsv<T>({
  filename,
  columns,
  rows,
  excludedColumnIds = DEFAULT_EXCLUDED_COLUMN_IDS,
}: {
  filename: string;
  columns: GridColumnDef<T>[];
  rows: T[];
  excludedColumnIds?: Set<string>;
}): void {
  const exportColumns = getGridExportColumns(columns, excludedColumnIds);
  if (exportColumns.length === 0) {
    throw new Error('No exportable columns');
  }

  const headers = exportColumns.map((column) => resolveGridColumnLabel(column.id, column.label));
  const body = rows.map((row) => exportColumns.map((column) => resolveGridExportCellValue(column, row)));

  const blob = new Blob([buildCsvContent(headers, body)], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = normalizeExportFilename(filename);
  anchor.click();
  URL.revokeObjectURL(url);
}
