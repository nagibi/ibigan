import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, LoaderCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { activityLogsService, type ActivityLog } from '@/services/activity-logs.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const descriptionVariant: Record<string, 'primary' | 'secondary' | 'destructive' | 'outline'> = {
  created: 'primary',
  updated: 'secondary',
  deleted: 'destructive',
};

const descriptionLabel: Record<string, string> = {
  created: 'Criado',
  updated: 'Atualizado',
  deleted: 'Removido',
};

function getSubjectLabel(type: string): string {
  const map: Record<string, string> = {
    'App\\Models\\User': 'Usuário',
    'App\\Models\\Organization': 'Organização',
    'App\\Models\\Menu': 'Menu',
    'App\\Models\\MessageTemplate': 'Template',
    'App\\Models\\Webhook': 'Webhook',
    'App\\Models\\Campaign': 'Campanha',
    'App\\Models\\Invite': 'Convite',
  };
  return map[type] ?? type.split('\\').pop() ?? type;
}

function hasChanges(props: Record<string, unknown>): boolean {
  if (!props || Object.keys(props).length === 0) return false;
  if (props.old && props.attributes) {
    const old = props.old as Record<string, unknown>;
    const attrs = props.attributes as Record<string, unknown>;
    return Object.keys(attrs).some((k) =>
      !['updated_at', 'id'].includes(k) &&
      JSON.stringify(old[k]) !== JSON.stringify(attrs[k]),
    );
  }
  return Object.keys(props).length > 0;
}

function countChanges(props: Record<string, unknown>): number {
  if (!props?.old || !props?.attributes) return 0;
  const old = props.old as Record<string, unknown>;
  const attrs = props.attributes as Record<string, unknown>;
  return Object.keys(attrs).filter((k) =>
    !['updated_at', 'id', 'created_at', 'deleted_at'].includes(k) &&
    JSON.stringify(old[k]) !== JSON.stringify(attrs[k]),
  ).length;
}

const SUBJECT_TYPES = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'App\\Models\\User', label: 'Usuário' },
  { value: 'App\\Models\\Organization', label: 'Organização' },
  { value: 'App\\Models\\Menu', label: 'Menu' },
  { value: 'App\\Models\\MessageTemplate', label: 'Template' },
  { value: 'App\\Models\\Webhook', label: 'Webhook' },
  { value: 'App\\Models\\Campaign', label: 'Campanha' },
];

export function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [filters, setFilters] = useState<{
    subject_type?: string;
    date_from?: string;
    date_to?: string;
  }>({});

  const { data, isLoading } = useQuery({
    queryKey: ['activity-logs', page, filters],
    queryFn: () => activityLogsService.list(page, filters),
  });

  const logs = data?.data.result.data ?? [];
  const meta = data?.data.result.meta;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Activity Log</h1>
        <p className="text-sm text-muted-foreground">Histórico de atividades do sistema.</p>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex gap-3 flex-wrap">
            <Select
              value={filters.subject_type ?? 'all'}
              onValueChange={(v) => {
                setPage(1);
                setFilters((f) => ({ ...f, subject_type: v === 'all' ? undefined : v }));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de recurso" />
              </SelectTrigger>
              <SelectContent>
                {SUBJECT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              className="w-[160px]"
              value={filters.date_from ?? ''}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, date_from: e.target.value || undefined }));
              }}
              placeholder="Data início"
            />
            <Input
              type="date"
              className="w-[160px]"
              value={filters.date_to ?? ''}
              onChange={(e) => {
                setPage(1);
                setFilters((f) => ({ ...f, date_to: e.target.value || undefined }));
              }}
              placeholder="Data fim"
            />

            {Object.keys(filters).length > 0 && (
              <Button variant="outline" size="sm" onClick={() => { setFilters({}); setPage(1); }}>
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Recurso</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Realizado por</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <LoaderCircle className="size-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Activity className="size-8 mx-auto mb-2 opacity-30" />
                  Nenhuma atividade registrada.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: ActivityLog) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLog(log)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{getSubjectLabel(log.subject_type)}</p>
                      <p className="text-xs text-muted-foreground">#{log.subject_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={descriptionVariant[log.description] ?? 'outline'}>
                      {descriptionLabel[log.description] ?? log.description}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.causer_name ?? (
                      <span className="text-muted-foreground">Sistema</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {hasChanges(log.properties)
                      ? `${countChanges(log.properties)} campo(s) alterado(s)`
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(log.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button>
          <span className="flex items-center text-sm text-muted-foreground">
            Página {meta.current_page} de {meta.last_page} ({meta.total} registros)
          </span>
          <Button variant="outline" size="sm" disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Activity className="size-4" />
              Detalhes da atividade
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Recurso</p>
                  <p className="font-medium">{getSubjectLabel(selectedLog.subject_type)} #{selectedLog.subject_id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Ação</p>
                  <Badge variant={descriptionVariant[selectedLog.description] ?? 'outline'}>
                    {descriptionLabel[selectedLog.description] ?? selectedLog.description}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Realizado por</p>
                  <p className="font-medium">{selectedLog.causer_name ?? 'Sistema'}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-muted-foreground text-xs">Data</p>
                  <p>{format(new Date(selectedLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                </div>
              </div>

              {selectedLog.properties?.old && selectedLog.properties?.attributes ? (
                <div>
                  <p className="text-sm font-medium mb-2">Campos alterados</p>
                  <div className="space-y-2">
                    {Object.entries(selectedLog.properties.attributes as Record<string, unknown>)
                      .filter(([k, v]) =>
                        !['updated_at', 'created_at', 'deleted_at', 'id'].includes(k) &&
                        JSON.stringify((selectedLog.properties.old as Record<string, unknown>)[k]) !== JSON.stringify(v),
                      )
                      .map(([key, newVal]) => (
                        <div key={key} className="grid grid-cols-[140px_1fr_1fr] gap-2 text-sm items-start">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{key}</span>
                          <div className="bg-destructive/10 text-destructive px-2 py-1 rounded text-xs font-mono break-all line-through">
                            {String((selectedLog.properties.old as Record<string, unknown>)[key] ?? '—')}
                          </div>
                          <div className="bg-green-500/10 text-green-700 px-2 py-1 rounded text-xs font-mono break-all">
                            {String(newVal ?? '—')}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : selectedLog.properties?.attributes ? (
                <div>
                  <p className="text-sm font-medium mb-2">Dados registrados</p>
                  <div className="space-y-2">
                    {Object.entries(selectedLog.properties.attributes as Record<string, unknown>)
                      .filter(([k]) => !['id', 'created_at', 'updated_at', 'deleted_at'].includes(k))
                      .map(([key, val]) => (
                        <div key={key} className="grid grid-cols-[140px_1fr] gap-2 text-sm">
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{key}</span>
                          <span className="text-xs font-mono px-2 py-1 break-all">{String(val ?? '—')}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem detalhes adicionais.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
