import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { menusService } from '@/services/menus.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório.'),
  slug: z.string().min(1, 'Slug é obrigatório.'),
  icon: z.string().optional(),
  path: z.string().optional(),
  target: z.enum(['_self', '_blank']),
  parent_id: z.number().nullable().optional(),
  order: z.number().int().min(0),
  is_active: z.boolean(),
  requires_auth: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function MenuFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { data: allMenus } = useQuery({
    queryKey: ['menus'],
    queryFn: () => menusService.list(),
  });

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => menusService.show(Number(id)),
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '', slug: '', icon: '', path: '', target: '_self',
      parent_id: null, order: 0, is_active: true, requires_auth: true,
    },
  });

  useEffect(() => {
    if (menuData?.data.result) {
      const m = menuData.data.result;
      form.reset({
        title: m.title,
        slug: m.slug,
        icon: m.icon ?? '',
        path: m.path ?? '',
        target: m.target as '_self' | '_blank',
        parent_id: m.parent_id,
        order: m.order,
        is_active: m.is_active,
        requires_auth: m.requires_auth,
      });
    }
  }, [menuData, form]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing
        ? menusService.update(Number(id), data)
        : menusService.store(data as Parameters<typeof menusService.store>[0]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      toast.success(isEditing ? 'Menu atualizado!' : 'Menu criado!');
      navigate('/menus');
    },
    onError: () => toast.error('Erro ao salvar menu.'),
  });

  const parentOptions = allMenus?.data.result
    .filter((m) => !m.parent_id && m.id !== Number(id))
    ?? [];

  if (isEditing && isLoading) {
    return (
      <div className="container py-6 flex justify-center">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate('/menus')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{isEditing ? 'Editar Menu' : 'Novo Item de Menu'}</h1>
          <p className="text-sm text-muted-foreground">Configure o item de navegação.</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados do menu</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl><Input placeholder="Ex: Dashboard" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl><Input placeholder="ex: dashboard" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="icon" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone (Lucide)</FormLabel>
                    <FormControl><Input placeholder="Ex: LayoutDashboard" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="path" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caminho</FormLabel>
                    <FormControl><Input placeholder="Ex: /dashboard" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="target" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="_self">Mesma aba</SelectItem>
                        <SelectItem value="_blank">Nova aba</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="order" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {parentOptions.length > 0 && (
                <FormField control={form.control} name="parent_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Menu pai (opcional)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v === 'none' ? null : Number(v))}
                      value={field.value ? String(field.value) : 'none'}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Nenhum (item raiz)" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (item raiz)</SelectItem>
                        {parentOptions.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}

              <div className="flex gap-6">
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="cursor-pointer">Ativo</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="requires_auth" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="cursor-pointer">Requer autenticação</FormLabel>
                  </FormItem>
                )} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <LoaderCircle className="size-4 mr-2 animate-spin" />}
                  {isEditing ? 'Salvar alterações' : 'Criar menu'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/menus')}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
