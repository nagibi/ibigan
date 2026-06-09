import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { reportsService } from '@/services/reports.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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

const paramSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'date', 'select']),
  label: z.string().min(1),
  required: z.boolean(),
  options: z.string().optional(),
});

const colSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  format: z.enum(['text', 'number', 'datetime', 'date', 'currency', 'boolean']),
});

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  description: z.string().optional(),
  query: z.string().min(1, 'Query é obrigatória.'),
  parameters: z.array(paramSchema),
  columns: z.array(colSchema),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function ReportFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsService.show(Number(id)),
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      query: '',
      parameters: [],
      columns: [],
      is_active: true,
    },
  });

  const { fields: paramFields, append: appendParam, remove: removeParam } = useFieldArray({
    control: form.control,
    name: 'parameters',
  });

  const { fields: colFields, append: appendCol, remove: removeCol } = useFieldArray({
    control: form.control,
    name: 'columns',
  });

  useEffect(() => {
    if (reportData?.data.result) {
      const r = reportData.data.result;
      form.reset({
        name: r.name,
        description: r.description ?? '',
        query: r.query ?? '',
        parameters: (r.parameters ?? []).map((p) => ({
          ...p,
          options: p.options?.join(',') ?? '',
        })),
        columns: r.columns ?? [],
        is_active: r.is_active,
      });
    }
  }, [reportData, form]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        parameters: data.parameters.map((p) => ({
          ...p,
          options: p.options ? p.options.split(',').map((o) => o.trim()) : undefined,
        })),
      };
      return isEditing
        ? reportsService.update(Number(id), payload)
        : reportsService.store(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(isEditing ? 'Relatório atualizado!' : 'Relatório criado!');
      navigate('/reports');
    },
    onError: () => toast.error('Erro ao salvar relatório.'),
  });

  if (isEditing && isLoading) {
    return (
      <div className="container py-6 flex justify-center">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate('/reports')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{isEditing ? 'Editar Relatório' : 'Novo Relatório'}</h1>
          <p className="text-sm text-muted-foreground">Configure o template de relatório.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Informações básicas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input placeholder="Usuários por período" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0 pt-8">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel>Ativo</FormLabel>
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl><Input placeholder="Breve descrição" {...field} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Query SQL</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="query" render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="SELECT id, name, email FROM users WHERE created_at BETWEEN :date_from AND :date_to"
                      className="min-h-[150px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use <code className="bg-muted px-1 rounded">:parametro</code> para parâmetros dinâmicos. Apenas SELECT é permitido.
                  </p>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Parâmetros</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendParam({ name: '', type: 'text', label: '', required: true })}
                >
                  <Plus className="size-4 mr-1" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {paramFields.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem parâmetros — relatório executa sem filtros.</p>
              )}
              {paramFields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
                  <FormField control={form.control} name={`parameters.${i}.name`} render={({ field: f }) => (
                    <FormItem>
                      {i === 0 && <FormLabel className="text-xs">Nome (código)</FormLabel>}
                      <FormControl><Input placeholder="date_from" className="font-mono text-sm" {...f} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name={`parameters.${i}.label`} render={({ field: f }) => (
                    <FormItem>
                      {i === 0 && <FormLabel className="text-xs">Label</FormLabel>}
                      <FormControl><Input placeholder="Data início" {...f} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name={`parameters.${i}.type`} render={({ field: f }) => (
                    <FormItem>
                      {i === 0 && <FormLabel className="text-xs">Tipo</FormLabel>}
                      <Select onValueChange={f.onChange} value={f.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="number">Número</SelectItem>
                          <SelectItem value="date">Data</SelectItem>
                          <SelectItem value="select">Seleção</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name={`parameters.${i}.required`} render={({ field: f }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 pb-1">
                      {i === 0 && <FormLabel className="text-xs block mb-2">Obrigatório</FormLabel>}
                      <FormControl><Switch checked={f.value} onCheckedChange={f.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <Button type="button" variant="ghost" mode="icon" size="sm" onClick={() => removeParam(i)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Colunas</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendCol({ key: '', label: '', format: 'text' })}
                >
                  <Plus className="size-4 mr-1" /> Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {colFields.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem colunas — exibe todos os campos retornados pela query.</p>
              )}
              {colFields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                  <FormField control={form.control} name={`columns.${i}.key`} render={({ field: f }) => (
                    <FormItem>
                      {i === 0 && <FormLabel className="text-xs">Chave (campo SQL)</FormLabel>}
                      <FormControl><Input placeholder="created_at" className="font-mono text-sm" {...f} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name={`columns.${i}.label`} render={({ field: f }) => (
                    <FormItem>
                      {i === 0 && <FormLabel className="text-xs">Label</FormLabel>}
                      <FormControl><Input placeholder="Criado em" {...f} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name={`columns.${i}.format`} render={({ field: f }) => (
                    <FormItem>
                      {i === 0 && <FormLabel className="text-xs">Formato</FormLabel>}
                      <Select onValueChange={f.onChange} value={f.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="number">Número</SelectItem>
                          <SelectItem value="date">Data</SelectItem>
                          <SelectItem value="datetime">Data e hora</SelectItem>
                          <SelectItem value="currency">Moeda</SelectItem>
                          <SelectItem value="boolean">Booleano</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <Button type="button" variant="ghost" mode="icon" size="sm" onClick={() => removeCol(i)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <LoaderCircle className="size-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar relatório'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/reports')}>Cancelar</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
