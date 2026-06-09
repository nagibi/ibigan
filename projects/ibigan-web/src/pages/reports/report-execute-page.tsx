import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Download,
  LoaderCircle,
  Play,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { reportsService, type ReportParameter } from '@/services/reports.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      toast.success(`${res.data.result.count} registros em ${res.data.result.duration}ms`);
    },
    onError: () => toast.error('Erro ao executar relatório.'),
  });

  function exportCSV() {
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
  }

  if (isLoading) {
    return (
      <div className="container py-6 flex justify-center">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
    );
  }

  const cols = report?.columns ?? (results ? Object.keys(results.rows[0] ?? {}).map((k) => ({ key: k, label: k, format: 'text' as const })) : []);

  return (
    <div className="container py-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate('/reports')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{report?.name}</h1>
          {report?.description && (
            <p className="text-sm text-muted-foreground">{report.description}</p>
          )}
        </div>
        <Badge variant={report?.is_active ? 'primary' : 'secondary'}>
          {report?.is_active ? 'Ativo' : 'Inativo'}
        </Badge>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Parâmetros</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit((d) => executeMutation.mutate(d))} className="space-y-4">
                  {(report?.parameters ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem parâmetros necessários.</p>
                  ) : (
                    report?.parameters?.map((p: ReportParameter) => (
                      <FormField
                        key={p.name}
                        control={form.control}
                        name={p.name}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {p.label}
                              {p.required && <span className="text-destructive ml-1">*</span>}
                            </FormLabel>
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
                    ))
                  )}

                  <Button type="submit" className="w-full" disabled={executeMutation.isPending}>
                    {executeMutation.isPending
                      ? <><LoaderCircle className="size-4 mr-2 animate-spin" /> Executando...</>
                      : <><Play className="size-4 mr-2" /> Executar</>}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {executions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="size-4" /> Histórico
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[300px] overflow-y-auto">
                  {executions.map((e) => (
                    <div key={e.id} className="px-4 py-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-xs">
                          {format(new Date(e.executed_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {e.status === 'success'
                          ? <CheckCircle className="size-3.5 text-green-600" />
                          : <XCircle className="size-3.5 text-destructive" />}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-xs text-muted-foreground">{e.executed_by}</span>
                        {e.status === 'success' && (
                          <span className="text-xs text-muted-foreground">{e.rows_count} linhas · {e.duration_ms}ms</span>
                        )}
                      </div>
                      {e.error_message && (
                        <p className="text-xs text-destructive mt-1 truncate">{e.error_message}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {!results ? (
            <div className="border rounded-lg flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Play className="size-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Execute o relatório para ver os resultados.</p>
              </div>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Resultados
                    <span className="text-muted-foreground font-normal text-sm ml-2">
                      {results.count} registros · {results.duration}ms
                    </span>
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={exportCSV}>
                    <Download className="size-4 mr-2" /> Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-auto max-h-[600px]">
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
                          <TableCell colSpan={cols.length} className="text-center py-8 text-muted-foreground">
                            Nenhum resultado encontrado para os filtros informados.
                          </TableCell>
                        </TableRow>
                      ) : (
                        results.rows.map((row, i) => (
                          <TableRow key={i}>
                            {cols.map((col) => (
                              <TableCell key={col.key} className="text-sm whitespace-nowrap">
                                {formatCell(row[col.key], col.format)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
