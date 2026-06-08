import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import { menusService, type ApiMenu } from '@/services/menus.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

function resolveIcon(name: string | null): LucideIcon | null {
  if (!name) return null;
  const icon = (Icons as Record<string, unknown>)[name];
  return typeof icon === 'function' ? (icon as LucideIcon) : null;
}

function MenuRow({ menu, depth = 0, onEdit, onDelete }: {
  menu: ApiMenu;
  depth?: number;
  onEdit: (m: ApiMenu) => void;
  onDelete: (id: number) => void;
}) {
  const Icon = resolveIcon(menu.icon);

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${depth * 20}px` }}>
            {depth > 0 && <ChevronRight className="size-3 text-muted-foreground" />}
            {Icon && <Icon className="size-4 text-muted-foreground" />}
            <span className="font-medium">{menu.title}</span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">{menu.path ?? '—'}</TableCell>
        <TableCell>
          <Badge variant="outline" className="text-xs">{menu.icon ?? '—'}</Badge>
        </TableCell>
        <TableCell>
          <Badge variant={menu.is_active ? 'default' : 'secondary'}>
            {menu.is_active ? 'Ativo' : 'Inativo'}
          </Badge>
        </TableCell>
        <TableCell>{menu.order}</TableCell>
        <TableCell>
          <div className="flex gap-1">
            <Button variant="ghost" mode="icon" size="sm" onClick={() => onEdit(menu)}>
              <Pencil className="size-4" />
            </Button>
            <Button variant="ghost" mode="icon" size="sm" onClick={() => onDelete(menu.id)}>
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {menu.children?.map((child) => (
        <MenuRow key={child.id} menu={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </>
  );
}

export function MenusPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menusService.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => menusService.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success('Menu removido com sucesso!');
      setDeleteId(null);
    },
    onError: () => toast.error('Erro ao remover menu.'),
  });

  const menus = data?.data.result ?? [];

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Menus</h1>
          <p className="text-sm text-muted-foreground">Gerencie a navegação do sistema.</p>
        </div>
        <Button onClick={() => navigate('/menus/novo')}>
          <Plus className="size-4 mr-2" /> Novo Item
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Caminho</TableHead>
              <TableHead>Ícone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ordem</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : menus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhum menu cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              menus.map((menu) => (
                <MenuRow
                  key={menu.id}
                  menu={menu}
                  onEdit={(m) => navigate(`/menus/${m.id}/editar`)}
                  onDelete={(id) => setDeleteId(id)}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover item de menu</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Filhos deste item também serão removidos.
            </AlertDialogDescription>
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
