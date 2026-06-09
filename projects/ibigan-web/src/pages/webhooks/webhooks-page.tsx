import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, LoaderCircle, Pencil, Plus, Trash2, Webhook, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { webhooksService, WEBHOOK_EVENTS, type Webhook as WebhookType } from '@/services/webhooks.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

export function WebhooksPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewDeliveries, setViewDeliveries] = useState<WebhookType | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['webhooks', page],
    queryFn: () => webhooksService.list(page),
  });

  const { data: deliveriesData } = useQuery({
    queryKey: ['webhook-deliveries', viewDeliveries?.id],
    queryFn: () => webhooksService.deliveries(viewDeliveries!.id),
    enabled: !!viewDeliveries,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => webhooksService.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success('Webhook removido.');
      setDeleteId(null);
    },
    onError: () => toast.error('Erro ao remover webhook.'),
  });

  const webhooks = data?.data.result.data ?? [];
  const meta = data?.data.result.meta;
  const deliveries = deliveriesData?.data.result.data ?? [];

  function getEventLabel(event: string): string {
    return WEBHOOK_EVENTS.find((e) => e.value === event)?.label ?? event;
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Webhooks</h1>
          <p className="text-sm text-muted-foreground">Integre eventos do sistema com sistemas externos.</p>
        </div>
        <Button onClick={() => navigate('/webhooks/novo')}>
          <Plus className="size-4 mr-2" /> Novo Webhook
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Eventos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <LoaderCircle className="size-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : webhooks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Webhook className="size-8 mx-auto mb-2 opacity-30" />
                  Nenhum webhook configurado.
                </TableCell>
              </TableRow>
            ) : (
              webhooks.map((w: WebhookType) => (
                <TableRow key={w.id}>
                  <TableCell>
                    <p className="font-mono text-sm truncate max-w-[250px]">{w.url}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {w.events.slice(0, 2).map((e) => (
                        <Badge key={e} variant="outline" className="text-xs">{getEventLabel(e)}</Badge>
                      ))}
                      {w.events.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{w.events.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={w.is_active ? 'primary' : 'secondary'}>
                      {w.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(w.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setViewDeliveries(w)}>
                        Logs
                      </Button>
                      <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate(`/webhooks/${w.id}/editar`)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" mode="icon" size="sm" onClick={() => setDeleteId(w.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
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
          <span className="flex items-center text-sm text-muted-foreground">Página {meta.current_page} de {meta.last_page}</span>
          <Button variant="outline" size="sm" disabled={page === meta.last_page} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
        </div>
      )}

      <Dialog open={!!viewDeliveries} onOpenChange={() => setViewDeliveries(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Logs de entrega — {viewDeliveries?.url}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[500px]">
            {deliveries.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground text-sm">Nenhuma entrega registrada.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-mono text-xs">{d.event}</TableCell>
                      <TableCell>
                        {d.status === 'success'
                          ? <CheckCircle className="size-4 text-green-600" />
                          : <XCircle className="size-4 text-destructive" />}
                      </TableCell>
                      <TableCell>
                        <Badge variant={d.response_status && d.response_status < 300 ? 'primary' : 'destructive'}>
                          {d.response_status ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(d.created_at), "dd/MM 'às' HH:mm:ss", { locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover webhook</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
