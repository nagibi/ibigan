import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Download,
  FileBarChart,
  LoaderCircle,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { reportsService, type MyReportExecution } from '@/services/reports.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const statusConfig: Record<string, {
  label: string;
  icon: ReactNode;
  variant: 'primary' | 'secondary' | 'destructive' | 'outline';
}> = {
  queued: { label: 'Na fila', icon: <Clock className="size-4 text-muted-foreground animate-pulse" />, variant: 'secondary' },
  running: { label: 'Executando', icon: <LoaderCircle className="size-4 text-blue-500 animate-spin" />, variant: 'outline' },
  completed: { label: 'Concluído', icon: <CheckCircle className="size-4 text-green-600" />, variant: 'primary' },
  failed: { label: 'Falhou', icon: <XCircle className="size-4 text-destructive" />, variant: 'destructive' },
};

export function MyExecutionsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-executions'],
    queryFn: () => reportsService.myExecutions(),
    refetchInterval: (query) => {
      const executions = query.state.data?.data.result.data ?? [];
      const hasPending = executions.some((e) =>
        ['queued', 'running'].includes(e.status),
      );
      return hasPending ? 3000 : false;
    },
  });

  const executions = data?.data.result.data ?? [];
  const meta = data?.data.result.meta;

  useEffect(() => {
    const prev = queryClient.getQueryData<typeof data>(['my-executions']);
    if (!prev) return;
    const prevExecutions = prev.data.result.data ?? [];
    const justCompleted = executions.filter((e) => {
      const was = prevExecutions.find((p) => p.id === e.id);
      return was?.status !== 'completed' && e.status === 'completed';
    });
    if (justCompleted.length > 0) {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  }, [executions, queryClient]);

  async function downloadResult(execution: MyReportExecution) {
    try {
      const res = await reportsService.result(execution.template_id, execution.id, 1, 10000);
      const rows = res.data.result.data;
      if (!rows.length) return;
      const keys = Object.keys(rows[0]);
      const csv = [
        keys.join(','),
        ...rows.map((row) => keys.map((k) => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(',')),
      ].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${execution.template_name}-${execution.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // erro silencioso
    }
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Minhas Execuções</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe o status dos seus relatórios em execução e baixe os resultados.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : executions.length === 0 ? (
        <div className="border rounded-lg flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileBarChart className="size-10 mb-3 opacity-20" />
          <p className="text-sm">Nenhuma execução encontrada.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/reports')}>
            Ver relatórios disponíveis
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {executions.map((e) => {
            const cfg = statusConfig[e.status] ?? statusConfig.queued;
            const isPending = ['queued', 'running'].includes(e.status);

            return (
              <Card key={e.id} className={isPending ? 'border-blue-200 bg-blue-50/30' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">{cfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{e.template_name}</p>
                          <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                        </div>

                        {isPending && e.progress_message && (
                          <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                            <LoaderCircle className="size-3 animate-spin" />
                            {e.progress_message}
                          </p>
                        )}

                        {e.status === 'completed' && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {e.rows_count} registros · {e.duration_ms}ms
                            {e.expires_at && (
                              <span className="ml-2">
                                · Expira em {format(new Date(e.expires_at), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            )}
                          </p>
                        )}

                        {e.status === 'failed' && e.error_message && (
                          <p className="text-sm text-destructive mt-1">{e.error_message}</p>
                        )}

                        {e.parameters && Object.keys(e.parameters).length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-2">
                            {Object.entries(e.parameters).map(([k, v]) => (
                              <Badge key={k} variant="outline" className="text-xs font-mono">
                                {k}: {v}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(e.executed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {e.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadResult(e)}
                        >
                          <Download className="size-4 mr-1" /> CSV
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/reports/${e.template_id}/executar`)}
                      >
                        <ArrowRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <p className="text-sm text-muted-foreground">{meta.total} execuções no total</p>
        </div>
      )}
    </div>
  );
}
