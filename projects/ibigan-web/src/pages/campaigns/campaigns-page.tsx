import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  LoaderCircle,
  Megaphone,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { campaignsService, type Campaign } from '@/services/campaigns.service';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const statusVariant: Record<string, 'primary' | 'secondary' | 'outline' | 'destructive'> = {
  draft: 'secondary',
  scheduled: 'outline',
  sending: 'primary',
  sent: 'primary',
  cancelled: 'destructive',
};

const statusLabel: Record<string, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  sending: 'Enviando',
  sent: 'Enviado',
  cancelled: 'Cancelado',
};

export function CampaignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', page],
    queryFn: () => campaignsService.list(page),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => campaignsService.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha cancelada.');
      setCancelId(null);
    },
    onError: () => toast.error('Erro ao cancelar campanha.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => campaignsService.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campanha removida.');
      setDeleteId(null);
    },
    onError: () => toast.error('Erro ao remover campanha.'),
  });

  const campaigns = data?.data.result.data ?? [];
  const meta = data?.data.result.meta;

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Campanhas</h1>
          <p className="text-sm text-muted-foreground">Gerencie comunicações e envios em massa.</p>
        </div>
        <Button onClick={() => navigate('/campaigns/nova')}>
          <Plus className="size-4 mr-2" /> Nova Campanha
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Canais</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Entregas</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="w-[130px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <LoaderCircle className="size-5 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Megaphone className="size-8 mx-auto mb-2 opacity-30" />
                  Nenhuma campanha criada ainda.
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((c: Campaign) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{c.name}</p>
                      {c.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {c.channels.map((ch) => (
                        <Badge key={ch} variant="outline" className="text-xs">{ch}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[c.status]}>{statusLabel[c.status]}</Badge>
                  </TableCell>
                  <TableCell>
                    {c.stats ? (
                      <div className="text-sm">
                        <span className="text-green-600">{c.stats.sent}</span>
                        <span className="text-muted-foreground">/{c.stats.total}</span>
                        {c.stats.failed > 0 && (
                          <span className="text-destructive ml-1">({c.stats.failed} falhas)</span>
                        )}
                      </div>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(c.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate(`/campaigns/${c.id}`)}>
                        <BarChart3 className="size-4 text-blue-500" />
                      </Button>
                      {c.status === 'draft' && (
                        <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate(`/campaigns/${c.id}/editar`)}>
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {['draft', 'scheduled'].includes(c.status) && (
                        <Button variant="ghost" mode="icon" size="sm" onClick={() => setCancelId(c.id)}>
                          <X className="size-4 text-orange-500" />
                        </Button>
                      )}
                      {['draft', 'cancelled'].includes(c.status) && (
                        <Button variant="ghost" mode="icon" size="sm" onClick={() => setDeleteId(c.id)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
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

      <AlertDialog open={cancelId !== null} onOpenChange={() => setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar campanha</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja cancelar esta campanha?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={() => cancelId && cancelMutation.mutate(cancelId)}>
              Cancelar campanha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover campanha</AlertDialogTitle>
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
