import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { StandardGridToolbar } from '@/components/grid/grid-toolbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/axios';

interface UserApproval {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

const statusLabel: Record<string, string> = {
  pending: 'Pendente',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

export function UserApprovalsPage() {
  const grid = useGrid();
  const [approvals, setApprovals] = useState<UserApproval[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [rejectTarget, setRejectTarget] = useState<UserApproval | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveTarget, setApproveTarget] = useState<UserApproval | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/user-approvals', {
        params: { status: statusFilter, page: grid.page, per_page: grid.perPage },
      });
      setApprovals(res.data.result.data);
      setTotal(res.data.result.meta.total);
    } catch {
      toast.error('Erro ao carregar aprovações.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, grid.page, grid.perPage]);

  useEffect(() => { void load(); }, [load]);

  async function handleApprove() {
    if (!approveTarget) return;
    try {
      setProcessing(true);
      await api.patch(`/v1/user-approvals/${approveTarget.id}/approve`);
      toast.success(`${approveTarget.user_name} aprovado com sucesso!`);
      setApproveTarget(null);
      void load();
    } catch {
      toast.error('Erro ao aprovar usuário.');
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    try {
      setProcessing(true);
      await api.patch(`/v1/user-approvals/${rejectTarget.id}/reject`, {
        reason: rejectReason,
      });
      toast.success(`${rejectTarget.user_name} rejeitado.`);
      setRejectTarget(null);
      setRejectReason('');
      void load();
    } catch {
      toast.error('Erro ao rejeitar usuário.');
    } finally {
      setProcessing(false);
    }
  }

  usePageToolbar({
    title: 'Aprovações',
    description: 'Gerencie solicitações de acesso à organização.',
    actions: (
      <StandardGridToolbar
        onRefresh={load}
        isRefreshing={loading}
        extra={
          <div className="flex gap-1 ml-2">
            {(['pending', 'approved', 'rejected'] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs"
                onClick={() => { setStatusFilter(s); grid.setPage(1); }}
              >
                {statusLabel[s]}
              </Button>
            ))}
          </div>
        }
      />
    ),
  });

  return (
    <div className="container py-6">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Solicitado em</TableHead>
                <TableHead>Revisado em</TableHead>
                <TableHead className="w-[120px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : approvals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma aprovação {statusLabel[statusFilter].toLowerCase()} encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                approvals.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{a.user_name}</p>
                        <p className="text-xs text-muted-foreground">{a.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[a.status]}>
                        {statusLabel[a.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(a.created_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {a.reviewed_at
                        ? format(new Date(a.reviewed_at), "dd/MM/yy 'às' HH:mm", { locale: ptBR })
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {a.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            mode="icon"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => setApproveTarget(a)}
                          >
                            <CheckCircle className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            mode="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => { setRejectTarget(a); setRejectReason(''); }}
                          >
                            <XCircle className="size-4" />
                          </Button>
                        </div>
                      )}
                      {a.rejection_reason && (
                        <p
                          className="text-xs text-muted-foreground max-w-[200px] truncate"
                          title={a.rejection_reason}
                        >
                          {a.rejection_reason}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {total > grid.perPage && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">{total} registros</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={grid.page === 1}
              onClick={() => grid.setPage(grid.page - 1)}
            >
              Anterior
            </Button>
            <span className="flex items-center text-sm px-2">
              {grid.page} de {Math.ceil(total / grid.perPage)}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={grid.page >= Math.ceil(total / grid.perPage)}
              onClick={() => grid.setPage(grid.page + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={approveTarget !== null} onOpenChange={() => setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar cadastro</AlertDialogTitle>
            <AlertDialogDescription>
              Aprovar o acesso de <strong>{approveTarget?.user_name}</strong> ({approveTarget?.user_email})?
              O usuário receberá um e-mail de confirmação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={processing}>
              <CheckCircle className="size-4 mr-2" /> Aprovar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={rejectTarget !== null} onOpenChange={() => setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar cadastro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Rejeitar o acesso de <strong>{rejectTarget?.user_name}</strong>?
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo (opcional)</label>
              <Textarea
                placeholder="Explique o motivo da rejeição..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing}
              >
                <XCircle className="size-4 mr-2" /> Rejeitar
              </Button>
              <Button variant="outline" onClick={() => setRejectTarget(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
