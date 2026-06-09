import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart2,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { reportsService, type ReportTemplate } from '@/services/reports.service';
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

export function ReportsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['reports', page],
    queryFn: () => reportsService.list(page),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => reportsService.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Relatório removido.');
      setDeleteId(null);
    },
  });

  const templates = data?.data.result.data ?? [];
  const meta = data?.data.result.meta;

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Execute e gerencie relatórios dinâmicos.</p>
        </div>
        <Button onClick={() => navigate('/reports/novo')}>
          <Plus className="size-4 mr-2" /> Novo Relatório
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Parâmetros</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <LoaderCircle className="size-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  <BarChart2 className="size-8 mx-auto mb-2 opacity-30" />
                  Nenhum relatório cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t: ReportTemplate) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <p className="font-medium">{t.name}</p>
                    {t.description && (
                      <p className="text-xs text-muted-foreground">{t.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {(t.parameters ?? []).map((p) => (
                        <Badge key={p.name} variant="outline" className="text-xs">
                          {p.label}{p.required ? ' *' : ''}
                        </Badge>
                      ))}
                      {(t.parameters ?? []).length === 0 && (
                        <span className="text-xs text-muted-foreground">Sem parâmetros</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={t.is_active ? 'primary' : 'secondary'}>
                      {t.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate(`/reports/${t.id}/executar`)}>
                        <Play className="size-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate(`/reports/${t.id}/editar`)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" mode="icon" size="sm" onClick={() => setDeleteId(t.id)}>
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

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover relatório</AlertDialogTitle>
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
