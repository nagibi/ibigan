import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { campaignsService } from '@/services/campaigns.service';
import { messageTemplatesService } from '@/services/message-templates.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const recipientSchema = z.object({
  type: z.enum(['all', 'role', 'permission', 'organization', 'user']),
  value: z.string().optional(),
});

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  description: z.string().optional(),
  template_id: z.number().nullable().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  channels: z.array(z.string()).min(1, 'Selecione pelo menos um canal.'),
  scheduled_at: z.string().nullable().optional(),
  recipients: z.array(recipientSchema).min(1, 'Adicione pelo menos um destinatário.'),
});

type FormData = z.infer<typeof schema>;

const CHANNELS = [
  { value: 'email', label: 'E-mail' },
  { value: 'notification', label: 'Notificação' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const RECIPIENT_TYPES = [
  { value: 'all', label: 'Todos os usuários' },
  { value: 'role', label: 'Por papel (role)' },
  { value: 'permission', label: 'Por permissão' },
  { value: 'organization', label: 'Por organização' },
  { value: 'user', label: 'Usuário específico' },
];

const ROLES = ['admin', 'manager', 'viewer'];

export function CampaignFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const [useTemplate, setUseTemplate] = useState(true);

  const { data: templatesData } = useQuery({
    queryKey: ['message-templates-all'],
    queryFn: () => messageTemplatesService.list(1),
  });

  const { data: campaignData, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsService.show(Number(id)),
    enabled: isEditing,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      template_id: null,
      subject: '',
      body: '',
      channels: ['email', 'notification'],
      recipients: [{ type: 'all' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'recipients',
  });

  useEffect(() => {
    if (campaignData?.data.result) {
      const c = campaignData.data.result;
      setUseTemplate(!!c.template_id);
      form.reset({
        name: c.name,
        description: c.description ?? '',
        template_id: c.template_id,
        subject: c.subject ?? '',
        body: c.body ?? '',
        channels: c.channels,
        recipients: [{ type: 'all' }],
      });
    }
  }, [campaignData, form]);

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        template_id: useTemplate ? data.template_id : null,
        subject: useTemplate ? undefined : data.subject,
        body: useTemplate ? undefined : data.body,
      };
      return isEditing
        ? campaignsService.update(Number(id), payload)
        : campaignsService.store(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success(isEditing ? 'Campanha atualizada!' : 'Campanha criada e enfileirada!');
      navigate('/campaigns');
    },
    onError: () => toast.error('Erro ao salvar campanha.'),
  });

  const templates = templatesData?.data.result.data ?? [];
  const channels = form.watch('channels');

  if (isEditing && isLoading) {
    return (
      <div className="container py-6 flex justify-center">
        <LoaderCircle className="size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" mode="icon" size="sm" onClick={() => navigate('/campaigns')}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">{isEditing ? 'Editar Campanha' : 'Nova Campanha'}</h1>
          <p className="text-sm text-muted-foreground">Configure e envie sua campanha.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Informações básicas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da campanha</FormLabel>
                  <FormControl><Input placeholder="Comunicado XPTO" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl><Input placeholder="Breve descrição da campanha" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Conteúdo</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Usar template</span>
                  <Switch checked={useTemplate} onCheckedChange={setUseTemplate} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {useTemplate ? (
                <FormField control={form.control} name="template_id" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template de mensagem</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={field.value ? String(field.value) : ''}
                    >
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name} <span className="text-muted-foreground ml-1 text-xs">({t.slug})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              ) : (
                <>
                  <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto</FormLabel>
                      <FormControl><Input placeholder="Comunicado importante sobre XPTO" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="body" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Corpo da mensagem</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Prezados, informamos que..." className="min-h-[150px]" {...field} />
                      </FormControl>
                      <FormDescription>Use {'{{variavel}}'} para personalização.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Canais de envio</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {CHANNELS.map((ch) => (
                  <div key={ch.value} className="flex items-center gap-2">
                    <Checkbox
                      id={ch.value}
                      checked={channels.includes(ch.value)}
                      onCheckedChange={(checked) => {
                        const current = form.getValues('channels');
                        if (checked) {
                          form.setValue('channels', [...current, ch.value]);
                        } else {
                          form.setValue('channels', current.filter((c) => c !== ch.value));
                        }
                      }}
                    />
                    <label htmlFor={ch.value} className="text-sm cursor-pointer">{ch.label}</label>
                  </div>
                ))}
              </div>
              {form.formState.errors.channels && (
                <p className="text-sm text-destructive mt-2">{form.formState.errors.channels.message}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Destinatários</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ type: 'role', value: 'viewer' })}
                >
                  <Plus className="size-4 mr-1" /> Adicionar critério
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <FormField
                    control={form.control}
                    name={`recipients.${index}.type`}
                    render={({ field: typeField }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={typeField.onChange} value={typeField.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {RECIPIENT_TYPES.map((t) => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  {form.watch(`recipients.${index}.type`) !== 'all' && (
                    <FormField
                      control={form.control}
                      name={`recipients.${index}.value`}
                      render={({ field: valueField }) => (
                        <FormItem className="flex-1">
                          {form.watch(`recipients.${index}.type`) === 'role' ? (
                            <Select onValueChange={valueField.onChange} value={valueField.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl><Input placeholder="Valor" {...valueField} /></FormControl>
                          )}
                        </FormItem>
                      )}
                    />
                  )}
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" mode="icon" size="sm" onClick={() => remove(index)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              {form.formState.errors.recipients && (
                <p className="text-sm text-destructive">{form.formState.errors.recipients.message}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Agendamento (opcional)</CardTitle></CardHeader>
            <CardContent>
              <FormField control={form.control} name="scheduled_at" render={({ field }) => (
                <FormItem>
                  <FormLabel>Enviar em</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value || null)}
                    />
                  </FormControl>
                  <FormDescription>Deixe em branco para enviar imediatamente.</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <LoaderCircle className="size-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar e enviar'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/campaigns')}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
