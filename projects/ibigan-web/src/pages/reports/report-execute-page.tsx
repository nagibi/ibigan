import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  Play,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { reportsService, type ReportParameter } from '@/services/reports.service';
import { PageBody } from '@/components/common/page-body';
import { FormFieldGrid, FormFieldGridItem } from '@/components/grid/form-field-grid';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';
import { FormPanel } from '@/components/grid/form-panel';
import {
  GridToolbarButton,
  GridToolbarGroup,
  GridToolbarPrimary,
  GridToolbarRoot,
} from '@/components/grid/grid-toolbar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function formatCell(value: unknown, fmt: string): string {
  if (value === null || value === undefined) return '—';
  if (fmt === 'datetime') {
    try { return format(new Date(String(value)), 'dd/MM/yyyy HH:mm', { locale: ptBR }); }
    catch { return String(value); }
  }
  if (fmt === 'date') {
    try { return format(new Date(String(value)), 'dd/MM/yyyy', { locale: ptBR }); }
    catch { return String(value); }
  }
  if (fmt === 'currency') return `R$ ${Number(value).toFixed(2)}`;
  if (fmt === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

export function ReportExecutePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useApiToolbarAlert();
  const [results, setResults] = useState<{
    rows: Record<string, unknown>[];
    count: number;
    duration: number;
  } | null>(null);

  const form = useForm<Record<string, string>>({ defaultValues: {} });

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsService.show(Number(id)),
  });

  const { data: executionsData, refetch: refetchExecutions } = useQuery({
    queryKey: ['report-executions', id],
    queryFn: () => reportsService.executions(Number(id)),
  });

  const report = reportData?.data.result;
  const executions = executionsData?.data.result.data ?? [];

  useEffect(() => {
    if (report?.parameters) {
      const defaults: Record<string, string> = {};
      report.parameters.forEach((p) => {
        if (p.type === 'date') {
          if (p.name.includes('from') || p.name.includes('inicio') || p.name.includes('start')) {
            defaults[p.name] = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd');
          } else if (p.name.includes('to') || p.name.includes('fim') || p.name.includes('end')) {
            defaults[p.name] = format(new Date(), 'yyyy-MM-dd');
          }
        }
      });
      form.reset(defaults);
    }
  }, [report, form]);

  const executeMutation = useMutation({
    mutationFn: (params: Record<string, string>) =>
      reportsService.execute(Number(id), params),
    onSuccess: (res) => {
      setResults(res.data.result);
      refetchExecutions();
      showSuccess(`${res.data.result.count} registros em ${res.data.result.duration}ms`);
    },
    onError: () => showError('Erro ao executar relatório.'),
  });

  const handleExecute = useCallback(() => {
    void form.handleSubmit((data) => executeMutation.mutate(data))();
  }, [executeMutation, form]);

  const exportCSV = useCallback(() => {
    if (!results || !report) return;
    const cols = report.columns ?? Object.keys(results.rows[0] ?? {}).map((k) => ({ key: k, label: k, format: 'text' as const }));
    const header = cols.map((c) => c.label).join(',');
    const rows = results.rows.map((row) =>
      cols.map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name}-${format(new Date(), 'yyyyMMdd-HHmm')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, results]);

  const toolbarActions = useMemo(
    () => (
      <GridToolbarRoot>
        <GridToolbarGroup>
          <GridToolbarButton
            label="Voltar"
            icon={ArrowLeft}
            onClick={() => navigate('/reports')}
          />
          <GridToolbarPrimary
            label="Executar"
            icon={Play}
            onClick={handleExecute}
            loading={executeMutation.isPending}
          />
          {results && (
            <GridToolbarButton
              label="Exportar CSV"
              icon={Download}
              onClick={exportCSV}
            />
          )}
        </GridToolbarGroup>
      </GridToolbarRoot>
    ),
    [executeMutation.isPending, exportCSV, handleExecute, navigate, results],
  );

  usePageToolbar({
    title: report?.name ?? 'Executar relatório',
    description: report?.description ?? 'Configure os parâmetros e execute o relatório.',
    actions: toolbarActions,
  });

  if (isLoading) {
    return (
      <FormPageSkeleton
        panels={[
          { titleWidth: 'w-28', fields: 2 },
          { titleWidth: 'w-24', fields: 1 },
        ]}
      />
    );
  }

  const cols = report?.columns ?? (results
    ? Object.keys(results.rows[0] ?? {}).map((k) => ({ key: k, label: k, format: 'text' as const }))
    : []);

  return (
    <PageBody>
      <div className="mb-4 flex items-center gap-2">
        <Badge variant={report?.is_active ? 'primary' : 'secondary'}>
          {report?.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <Form {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleExecute();
          }}
        >
          <FormPanel title="Parâmetros">
            <FormFieldGrid>
              {(report?.parameters ?? []).length === 0 ? (
                <FormFieldGridItem span={2}>
                  <p className="text-sm text-muted-foreground">Sem parâmetros necessários.</p>
                </FormFieldGridItem>
              ) : (
                report?.parameters?.map((p: ReportParameter) => (
                  <FormFieldGridItem key={p.name}>
                    <FormField
                      control={form.control}
                      name={p.name}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required={p.required}>{p.label}</FormLabel>
                          <FormControl>
                            {p.type === 'select' ? (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                <SelectContent>
                                  {p.options?.map((o) => (
                                    <SelectItem key={o} value={o}>{o}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                type={p.type === 'date' ? 'date' : p.type === 'number' ? 'number' : 'text'}
                                {...field}
                              />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </FormFieldGridItem>
                ))
              )}
            </FormFieldGrid>
          </FormPanel>
        </form>
      </Form>

      {executions.length > 0 && (
        <FormPanel title="Histórico recente">
          <div className="divide-y rounded-md border">
            {executions.slice(0, 5).map((execution) => (
              <div key={execution.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(execution.executed_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    {' · '}
                    {execution.executed_by}
                  </p>
                  {execution.error_message && (
                    <p className="truncate text-xs text-destructive">{execution.error_message}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {execution.status === 'success'
                    ? <CheckCircle className="size-4 text-green-600" />
                    : <XCircle className="size-4 text-destructive" />}
                  {execution.status === 'success' && (
                    <span className="text-xs text-muted-foreground">
                      {execution.rows_count} linhas · {execution.duration_ms}ms
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </FormPanel>
      )}

      <FormPanel
        title="Resultados"
        description={results ? `${results.count} registros · ${results.duration}ms` : undefined}
      >
        {!results ? (
          <div className="flex h-48 items-center justify-center rounded-md border text-muted-foreground">
            <div className="text-center">
              <Clock className="mx-auto mb-2 size-8 opacity-20" />
              <p className="text-sm">Execute o relatório para ver os resultados.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-auto max-h-[600px] rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {cols.map((col) => (
                    <TableHead key={col.key} className="whitespace-nowrap">{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={cols.length} className="py-8 text-center text-muted-foreground">
                      Nenhum resultado encontrado para os filtros informados.
                    </TableCell>
                  </TableRow>
                ) : (
                  results.rows.map((row, index) => (
                    <TableRow key={index}>
                      {cols.map((col) => (
                        <TableCell key={col.key} className="whitespace-nowrap text-sm">
                          {formatCell(row[col.key], col.format)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </FormPanel>
    </PageBody>
  );
}
