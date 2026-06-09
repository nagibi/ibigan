import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { webhooksService, WEBHOOK_EVENTS } from '@/services/webhooks.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

const schema = z.object({
  url: z.string().url('URL inválida.'),
  events: z.array(z.string()).min(1, 'Selecione pelo menos um evento.'),
  is_active: z.boolean(),
  secret: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function WebhookFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { data: webhookData, isLoading } = useQuery({
    queryKey: ['webhook', id],
    queryFn: () => webhooksService.show(Number(id)),
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { url: '', events: [], is_active: true, secret: '' },
  });

  useEffect(() => {
    if (webhookData?.data.result) {
      const w = webhookData.data.result;
      form.reset({
        url: w.url,
        events: w.events,
        is_active: w.is_active,
        secret: w.secret ?? '',
      });
    }
  }, [webhookData, form]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        secret: data.secret || undefined,
      };
      return isEditing
        ? webhooksService.update(Number(id), payload)
        : webhooksService.store(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      toast.success(isEditing ? 'Webhook atualizado!' : 'Webhook criado!');
      navigate('/webhooks');
    },
    onError: () => toast.error('Erro ao salvar webhook.'),
  });

  const events = form.watch('events');

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
        <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate('/webhooks')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{isEditing ? 'Editar Webhook' : 'Novo Webhook'}</h1>
          <p className="text-sm text-muted-foreground">Configure o endpoint para receber eventos.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Configuração</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="url" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do endpoint</FormLabel>
                  <FormControl>
                    <Input placeholder="https://meusite.com/webhook" {...field} />
                  </FormControl>
                  <FormDescription>O endpoint deve aceitar requisições POST com JSON.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="secret" render={({ field }) => (
                <FormItem>
                  <FormLabel>Secret (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="chave-secreta-para-validar-assinatura" {...field} />
                  </FormControl>
                  <FormDescription>Usado para validar a autenticidade do payload via HMAC-SHA256.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="is_active" render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel>Webhook ativo</FormLabel>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Eventos</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <div key={event.value} className="flex items-center gap-2">
                    <Checkbox
                      id={event.value}
                      checked={events.includes(event.value)}
                      onCheckedChange={(checked) => {
                        const current = form.getValues('events');
                        if (checked) {
                          form.setValue('events', [...current, event.value]);
                        } else {
                          form.setValue('events', current.filter((e) => e !== event.value));
                        }
                      }}
                    />
                    <label htmlFor={event.value} className="text-sm cursor-pointer">{event.label}</label>
                  </div>
                ))}
              </div>
              {form.formState.errors.events && (
                <p className="text-sm text-destructive mt-2">{form.formState.errors.events.message}</p>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <LoaderCircle className="size-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar webhook'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/webhooks')}>Cancelar</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
