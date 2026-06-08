import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { usersService } from '@/services/users.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const createSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.'),
  password_confirmation: z.string(),
  role: z.string().min(1, 'Selecione um papel.'),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'As senhas não coincidem.',
  path: ['password_confirmation'],
});

const editSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  role: z.string().min(1, 'Selecione um papel.'),
});

type CreateFormData = z.infer<typeof createSchema>;
type EditFormData = z.infer<typeof editSchema>;

export function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersService.show(Number(id)),
    enabled: isEditing,
  });

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '', role: 'viewer' },
  });

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: '', email: '', role: 'viewer' },
  });

  useEffect(() => {
    if (userData?.data.result) {
      const user = userData.data.result;
      editForm.reset({
        name: user.name,
        email: user.email,
        role: user.roles?.[0] ?? 'viewer',
      });
    }
  }, [userData, editForm]);

  const createMutation = useMutation({
    mutationFn: (data: CreateFormData) => usersService.store(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
      navigate('/users');
    },
    onError: (error: unknown) => {
      const apiErrors = (error as { response?: { data?: { errors?: Record<string, string[]> } } })
        ?.response?.data?.errors;

      if (apiErrors) {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          createForm.setError(field as keyof CreateFormData, {
            message: messages[0],
          });
        });
      } else {
        toast.error('Erro ao criar usuário.');
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) => usersService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário atualizado com sucesso!');
      navigate('/users');
    },
    onError: (error: unknown) => {
      const apiErrors = (error as { response?: { data?: { errors?: Record<string, string[]> } } })
        ?.response?.data?.errors;

      if (apiErrors) {
        Object.entries(apiErrors).forEach(([field, messages]) => {
          editForm.setError(field as keyof EditFormData, {
            message: messages[0],
          });
        });
      } else {
        toast.error('Erro ao atualizar usuário.');
      }
    },
  });

  if (isEditing && isLoadingUser) {
    return (
      <div className="container py-6 flex justify-center">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate('/users')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? 'Atualize os dados do usuário.' : 'Preencha os dados para criar um usuário.'}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do usuário</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
                <FormField control={editForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Papel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione um papel" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && <LoaderCircle className="size-4 mr-2 animate-spin" />}
                    Salvar alterações
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
                <FormField control={createForm.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input placeholder="Nome completo" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={createForm.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={createForm.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={createForm.control} name="password_confirmation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl><Input type="password" placeholder="Repita a senha" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={createForm.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Papel</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione um papel" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <LoaderCircle className="size-4 mr-2 animate-spin" />}
                    Criar usuário
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate('/users')}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
