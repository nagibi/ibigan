import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import { type Campaign } from '@/services/campaigns.service';
import { useCampaignContext } from '@/hooks/use-campaign-context';
import { rolesService } from '@/services/roles.service';
import { permissionsService } from '@/services/permissions.service';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useFormKeyboard } from '@/hooks/use-form-keyboard';
import { useFormPage } from '@/hooks/use-form-page';
import { useFormRefresh } from '@/hooks/use-form-refresh';
import { useFormToolbarAlert } from '@/hooks/use-form-toolbar-alert';
import { FormToolbar } from '@/components/grid/form-toolbar';
import { PageBody } from '@/components/common/page-body';
import { FormFieldGrid, FormFieldGridItem, FormInlineRow } from '@/components/grid/form-field-grid';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';
import { FormPanel } from '@/components/grid/form-panel';
import { FormRecordIdField } from '@/components/grid/form-record-identifier';
import { FormSwitchControl } from '@/components/grid/form-switch-control';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
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
import { TenantMultiSelect } from '@/components/tenant/tenant-multi-select';
import { UserCombobox } from '@/components/users/user-combobox';
import { UserMultiComboboxField } from '@/components/users/user-multi-combobox';

const recipientSchema = z.object({
  type: z.enum(['all', 'role', 'permission', 'user', 'users']),
  value: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type !== 'all' && (!data.value || data.value.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Valor é obrigatório.',
      path: ['value'],
    });
  }
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

const DEFAULT_VALUES: FormData = {
  name: '',
  description: '',
  template_id: null,
  subject: '',
  body: '',
  channels: ['email', 'notification'],
  recipients: [{ type: 'all' }],
};

const CHANNELS = [
  { value: 'email', label: 'E-mail' },
  { value: 'notification', label: 'Notificação' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

const RECIPIENT_TYPES = [
  { value: 'all', label: 'Todos os usuários' },
  { value: 'role', label: 'Por função (role)' },
  { value: 'permission', label: 'Por permissão' },
  { value: 'user', label: 'Usuário específico' },
  { value: 'users', label: 'Múltiplos usuários' },
];

const CENTRAL_ROLES = ['admin', 'manager', 'viewer'];

function isDeletable(campaign: Campaign) {
  return campaign.status === 'draft' || campaign.status === 'cancelled';
}

export function CampaignFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const campaignContext = useCampaignContext();
  const {
    isCentralDispatch,
    listPath,
    newPath,
    campaignsApi,
    templatesApi,
  } = campaignContext;
  const isEditing = Boolean(id) && !isCentralDispatch;
  const [useTemplate, setUseTemplate] = useState(true);
  const [tenantIds, setTenantIds] = useState<string[]>([]);
  const [tenantIdsError, setTenantIdsError] = useState<string | undefined>();

  const apiNotify = useApiToolbarAlert();

  const { data: templatesData } = useQuery({
    queryKey: [isCentralDispatch ? 'platform-message-templates-all' : 'message-templates-all'],
    queryFn: () => templatesApi.list(1, 100),
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesService.list(),
    enabled: !isCentralDispatch,
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsService.list(),
    enabled: !isCentralDispatch,
  });

  const { data: campaignData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => ('show' in campaignsApi ? campaignsApi.show(Number(id)) : Promise.reject(new Error('unavailable'))),
    enabled: isEditing,
  });

  const campaign = campaignData?.data.result;

  const formPage = useFormPage({
    backPath: listPath,
    newPath,
    entityKey: 'campaign',
    notify: apiNotify,
    onDelete: isEditing && 'destroy' in campaignsApi
      ? async () => {
          const current = campaignData?.data.result;
          if (current && !isDeletable(current)) return;
          await campaignsApi.destroy(Number(id));
          queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        }
      : undefined,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'recipients',
  });

  useLayoutEffect(() => {
    if (!isEditing) {
      form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
      setUseTemplate(true);
      setTenantIds([]);
      setTenantIdsError(undefined);
    }
  }, [isEditing, form, location.key]);

  useEffect(() => {
    if (campaign) {
      if (campaign.status !== 'draft') {
        navigate(`/campaigns/${campaign.id}`, { replace: true });
        return;
      }

      setUseTemplate(!!campaign.template_id);
      form.reset(
        {
          name: campaign.name,
          description: campaign.description ?? '',
          template_id: campaign.template_id,
          subject: campaign.subject ?? '',
          body: campaign.body ?? '',
          channels: campaign.channels,
          scheduled_at: campaign.scheduled_at,
          recipients: [{ type: 'all' }],
        },
        { keepDirty: false, keepErrors: false },
      );
    }
  }, [campaign, form, navigate]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const selectedTemplate = templates.find((template) => template.id === data.template_id);
      const basePayload = {
        name: data.name,
        description: data.description,
        channels: data.channels,
        scheduled_at: data.scheduled_at,
        recipients: data.recipients,
        merge_data: undefined,
        subject: useTemplate ? undefined : data.subject,
        body: useTemplate ? undefined : data.body,
        template_id: useTemplate ? data.template_id : null,
      };

      if (isCentralDispatch) {
        if (tenantIds.length === 0) {
          return Promise.reject(new Error('tenant-required'));
        }

        return campaignsApi.store({
          ...basePayload,
          tenant_ids: tenantIds,
          template_slug: useTemplate ? selectedTemplate?.slug : undefined,
          template_id: undefined,
        });
      }

      return isEditing && 'update' in campaignsApi
        ? campaignsApi.update(Number(id), basePayload)
        : campaignsApi.store(basePayload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      }

      if (isCentralDispatch) {
        const skipped = response.data.result.skipped?.length ?? 0;
        apiNotify.showSuccess(
          skipped > 0
            ? `Campanha disparada. ${skipped} empresa(s) ignorada(s).`
            : 'Campanha disparada nas empresas selecionadas!',
        );
        if (formPage.saveMode === 'new') {
          form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
          setTenantIds([]);
        } else {
          navigate(listPath);
        }
        return;
      }

      apiNotify.showSuccess(isEditing ? 'Campanha atualizada!' : 'Campanha criada e enfileirada!');
      if (!isEditing && formPage.saveMode === 'new') {
        form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
      }
      const createdId = !isEditing ? response.data.result.id : undefined;
      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath,
        newPath,
        getEditPath: (recordId) => `/campaigns/${recordId}/edit`,
        isEditing,
        createdId,
      });
      if (nextPath) navigate(nextPath);
    },
    onError: (error: unknown) => {
      if (error instanceof Error && error.message === 'tenant-required') {
        apiNotify.showError('Selecione pelo menos uma empresa.');
        return;
      }

      const handled = applyApiFormErrors(form, error);
      if (!handled) {
        apiNotify.showError(
          isEditing ? 'Erro ao atualizar campanha.' : 'Erro ao salvar campanha.',
          error,
        );
      }
    },
  });

  const validateCentralTenants = useCallback(() => {
    if (!isCentralDispatch || tenantIds.length > 0) {
      setTenantIdsError(undefined);
      return true;
    }

    setTenantIdsError('Selecione pelo menos uma empresa.');
    return false;
  }, [isCentralDispatch, tenantIds.length]);

  const handleSaveAndList = useCallback(() => {
    if (!validateCentralTenants()) return;

    formPage.setSaveMode('list');
    void form.handleSubmit((data) => saveMutation.mutate(data))();
  }, [form, formPage, saveMutation, validateCentralTenants]);

  const handleSaveAndNew = useCallback(() => {
    if (!validateCentralTenants()) return;

    formPage.setSaveMode('new');
    void form.handleSubmit((data) => saveMutation.mutate(data))();
  }, [form, formPage, saveMutation, validateCentralTenants]);

  const handleSaveAndEdit = useCallback(() => {
    if (!validateCentralTenants()) return;

    formPage.setSaveMode('edit');
    void form.handleSubmit((data) => saveMutation.mutate(data))();
  }, [form, formPage, saveMutation, validateCentralTenants]);

  const handlePrimarySave = handleSaveAndList;

  useFormKeyboard({
    enabled: !isEditing || !isLoading,
    onSave: handlePrimarySave,
    isSubmitting: saveMutation.isPending,
  });

  const formAlert = useFormToolbarAlert(form);

  const formRefresh = useFormRefresh({
    isEditing,
    isDirty: form.formState.isDirty,
    isFetching: isEditing && isFetching,
    refetch: isEditing ? () => refetch() : undefined,
    onReset: !isEditing
      ? () => form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false })
      : undefined,
  });

  const pageTitle = isCentralDispatch
    ? 'Disparar campanha'
    : formatFormPageTitle({
        isEditing,
        id,
        label: campaign?.name,
        loading: isEditing && isLoading,
      });

  usePageToolbar({
    title: pageTitle,
    alert: formAlert,
    actions: (
      <FormToolbar
        isEditing={isEditing}
        isDirty={form.formState.isDirty}
        isSubmitting={saveMutation.isPending}
        isDeleting={formPage.isDeleting}
        onSaveAndList={handleSaveAndList}
        onSaveAndNew={handleSaveAndNew}
        onSaveAndEdit={handleSaveAndEdit}
        onBack={formPage.handleBack}
        onNew={isEditing ? formPage.handleNew : undefined}
        onClear={() => form.reset()}
        onRefresh={formRefresh.onRefresh}
        isRefreshing={formRefresh.isRefreshing}
        onDelete={isEditing && campaign && isDeletable(campaign) ? formPage.handleDelete : undefined}
        entityLabel="campanha"
        recordLabel={campaign?.name}
      />
    ),
  });

  const templates = templatesData?.data.result.data ?? [];
  const roles = isCentralDispatch ? CENTRAL_ROLES.map((name) => ({ id: name, name })) : (rolesData?.data.result ?? []);
  const permissions = permissionsData?.data.result ?? [];
  const recipientTypeOptions = isCentralDispatch
    ? RECIPIENT_TYPES.filter((type) => !['user', 'users'].includes(type.value))
    : RECIPIENT_TYPES;
  const channels = form.watch('channels');

  if (isEditing && isLoading) {
    return (
      <FormPageSkeleton
        panels={[
          { titleWidth: 'w-40', fields: 2, showBadge: false },
          { titleWidth: 'w-28', fields: 2, showBadge: false },
          { titleWidth: 'w-36', fields: 2, showBadge: false },
          { titleWidth: 'w-32', fields: 2, showBadge: false },
          { titleWidth: 'w-44', fields: 1, showBadge: false },
        ]}
      />
    );
  }

  return (
    <PageBody>
      <Form {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handlePrimarySave();
          }}
        >
          <FormPanel title="Informações básicas">
            <FormFieldGrid>
              {isEditing && id && (
                <FormFieldGridItem>
                  <FormRecordIdField id={id} />
                </FormFieldGridItem>
              )}
              <FormFieldGridItem span={isEditing ? 1 : 2}>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Nome da campanha</FormLabel>
                    <FormControl><Input placeholder="Comunicado XPTO" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem span={isEditing ? 1 : 2}>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl><Input placeholder="Breve descrição da campanha" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
            </FormFieldGrid>
          </FormPanel>

          {isCentralDispatch ? (
            <FormPanel title="Empresas destinatárias">
              <FormFieldGrid>
                <FormFieldGridItem span={4}>
                  <FormItem>
                    <FormLabel required>Empresas</FormLabel>
                    <TenantMultiSelect
                      value={tenantIds}
                      onChange={(nextTenantIds) => {
                        setTenantIds(nextTenantIds);
                        if (nextTenantIds.length > 0) {
                          setTenantIdsError(undefined);
                        }
                      }}
                      placeholder="Selecione uma ou mais empresas"
                      error={tenantIdsError}
                    />
                    <FormDescription>
                      A campanha será criada e disparada em cada empresa selecionada.
                    </FormDescription>
                  </FormItem>
                </FormFieldGridItem>
              </FormFieldGrid>
            </FormPanel>
          ) : null}

          <FormPanel title="Conteúdo">
            <FormFieldGrid className="mb-4">
              <FormFieldGridItem>
                <div className="flex flex-col gap-2.5">
                  <Label>Usar template</Label>
                  <FormSwitchControl checked={useTemplate} onCheckedChange={setUseTemplate} />
                </div>
              </FormFieldGridItem>
            </FormFieldGrid>
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
              <FormFieldGrid>
                <FormFieldGridItem span={4}>
                  <FormField control={form.control} name="subject" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assunto</FormLabel>
                      <FormControl><Input placeholder="Comunicado importante sobre XPTO" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </FormFieldGridItem>
                <FormFieldGridItem span={4}>
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
                </FormFieldGridItem>
              </FormFieldGrid>
            )}
          </FormPanel>

          <FormPanel title="Canais de envio">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {CHANNELS.map((ch) => (
                <div key={ch.value} className="flex items-center gap-2">
                  <Checkbox
                    id={ch.value}
                    checked={channels.includes(ch.value)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('channels');
                      if (checked) {
                        form.setValue('channels', [...current, ch.value], { shouldDirty: true });
                      } else {
                        form.setValue(
                          'channels',
                          current.filter((c) => c !== ch.value),
                          { shouldDirty: true },
                        );
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
          </FormPanel>

          <FormPanel title="Destinatários">
            <div className="mb-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ type: 'role', value: 'viewer' })}
              >
                <Plus className="size-4 mr-1" /> Adicionar critério
              </Button>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <FormInlineRow key={field.id}>
                  <FormField
                    control={form.control}
                    name={`recipients.${index}.type`}
                    render={({ field: typeField }) => (
                      <FormItem className="flex-1">
                        <Select
                          onValueChange={(nextType) => {
                            typeField.onChange(nextType);
                            form.setValue(`recipients.${index}.value`, '', { shouldDirty: true });
                          }}
                          value={typeField.value}
                        >
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {recipientTypeOptions.map((t) => (
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
                      render={({ field: valueField }) => {
                        const recipientType = form.watch(`recipients.${index}.type`);

                        return (
                          <FormItem className="flex-1">
                            {recipientType === 'role' ? (
                              <Select onValueChange={valueField.onChange} value={valueField.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : recipientType === 'permission' && !isCentralDispatch ? (
                              <Select onValueChange={valueField.onChange} value={valueField.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Selecione a permissão" /></SelectTrigger></FormControl>
                                <SelectContent>
                                  {permissions.map((permission) => (
                                    <SelectItem key={permission.id} value={permission.name}>{permission.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : recipientType === 'permission' ? (
                              <FormControl><Input placeholder="Nome da permissão (ex: template-visualizar)" {...valueField} /></FormControl>
                            ) : recipientType === 'user' ? (
                              <FormControl>
                                <UserCombobox
                                  value={valueField.value}
                                  onChange={valueField.onChange}
                                  placeholder="Selecione o usuário"
                                />
                              </FormControl>
                            ) : recipientType === 'users' ? (
                              <FormControl>
                                <UserMultiComboboxField
                                  value={valueField.value}
                                  onChange={valueField.onChange}
                                  placeholder="Selecione os usuários"
                                />
                              </FormControl>
                            ) : (
                              <FormControl><Input placeholder="Valor" {...valueField} /></FormControl>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  )}
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" mode="icon" size="sm" className="self-end sm:self-start" onClick={() => remove(index)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  )}
                </FormInlineRow>
              ))}
              {form.formState.errors.recipients && (
                <p className="text-sm text-destructive">{form.formState.errors.recipients.message}</p>
              )}
            </div>
          </FormPanel>

          <FormPanel title="Agendamento (opcional)">
            <FormFieldGrid>
              <FormFieldGridItem span={2}>
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
              </FormFieldGridItem>
            </FormFieldGrid>
          </FormPanel>
        </form>
      </Form>
    </PageBody>
  );
}
