import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import { webhooksService, WEBHOOK_EVENTS } from '@/services/webhooks.service';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useFormKeyboard } from '@/hooks/use-form-keyboard';
import { useFormPage } from '@/hooks/use-form-page';
import { useFormToolbarAlert } from '@/hooks/use-form-toolbar-alert';
import { buildInactiveAlert, mergeToolbarAlerts } from '@/components/grid/toolbar-alert';
import { FormToolbar } from '@/components/grid/form-toolbar';
import { PageBody } from '@/components/common/page-body';
import { FormFieldGrid, FormFieldGridItem } from '@/components/grid/form-field-grid';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';
import { FormPanel } from '@/components/grid/form-panel';
import { FormRecordIdField } from '@/components/grid/form-record-identifier';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const schema = z.object({
  url: z.string().url('URL inválida.'),
  events: z.array(z.string()).min(1, 'Selecione pelo menos um evento.'),
  secret: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  url: '',
  events: [],
  secret: '',
};

export function WebhookFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { data: webhookData, isLoading } = useQuery({
    queryKey: ['webhook', id],
    queryFn: () => webhooksService.show(Number(id)),
    enabled: isEditing,
  });

  const webhook = webhookData?.data.result;
  const isActive = webhook?.is_active ?? true;

  const apiNotify = useApiToolbarAlert();

  const formPage = useFormPage({
    backPath: '/webhooks',
    newPath: '/webhooks/new',
    entityLabel: 'webhook',
    notify: apiNotify,
    onDelete: isEditing
      ? async () => {
          await webhooksService.destroy(Number(id));
          queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        }
      : undefined,
    onToggleActive: isEditing
      ? async (active) => {
          await webhooksService.toggleActive(Number(id), active);
          queryClient.invalidateQueries({ queryKey: ['webhook', id] });
          queryClient.invalidateQueries({ queryKey: ['webhooks'] });
        }
      : undefined,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useLayoutEffect(() => {
    if (!isEditing) {
      form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
    }
  }, [isEditing, form, location.key]);

  useEffect(() => {
    if (webhook) {
      form.reset(
        {
          url: webhook.url,
          events: webhook.events,
          secret: webhook.secret ?? '',
        },
        { keepDirty: false, keepErrors: false },
      );
    }
  }, [webhook, form]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        secret: data.secret || undefined,
        is_active: isEditing ? isActive : true,
      };
      return isEditing
        ? webhooksService.update(Number(id), payload)
        : webhooksService.store(payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['webhook', id] });
      }
      apiNotify.showSuccess(isEditing ? 'Webhook atualizado!' : 'Webhook criado!');
      if (!isEditing && formPage.saveMode === 'new') {
        form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
      }
      const createdId = !isEditing ? response.data.result.id : undefined;
      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/webhooks',
        newPath: '/webhooks/new',
        getEditPath: (recordId) => `/webhooks/${recordId}`,
        isEditing,
        createdId,
      });
      if (nextPath) navigate(nextPath);
    },
    onError: (error: unknown) => {
      const handled = applyApiFormErrors(form, error);
      if (!handled) {
        apiNotify.showError(
          isEditing ? 'Erro ao atualizar webhook.' : 'Erro ao criar webhook.',
          error,
        );
      }
    },
  });

  const handleSaveAndList = useCallback(() => {
    formPage.setSaveMode('list');
    void form.handleSubmit((data) => saveMutation.mutate(data))();
  }, [form, formPage, saveMutation]);

  const handleSaveAndNew = useCallback(() => {
    formPage.setSaveMode('new');
    void form.handleSubmit((data) => saveMutation.mutate(data))();
  }, [form, formPage, saveMutation]);

  const handleSaveAndEdit = useCallback(() => {
    formPage.setSaveMode('edit');
    void form.handleSubmit((data) => saveMutation.mutate(data))();
  }, [form, formPage, saveMutation]);

  const handlePrimarySave = handleSaveAndList;

  useFormKeyboard({
    enabled: !isEditing || !isLoading,
    onSave: handlePrimarySave,
    isSubmitting: saveMutation.isPending,
  });

  const formAlert = useFormToolbarAlert(form);

  const pageAlert = useMemo(
    () => mergeToolbarAlerts(
      formAlert,
      isEditing && !isActive ? buildInactiveAlert('webhook') : null,
    ),
    [formAlert, isActive, isEditing],
  );

  const events = form.watch('events');

  const pageTitle = formatFormPageTitle({
    isEditing,
    id,
    label: webhook?.url,
    loading: isEditing && isLoading,
  });

  usePageToolbar({
    title: pageTitle,
    alert: pageAlert,
    actions: (
      <FormToolbar
        isEditing={isEditing}
        isActive={isActive}
        isDirty={form.formState.isDirty}
        isSubmitting={saveMutation.isPending}
        isTogglingActive={formPage.isTogglingActive}
        isDeleting={formPage.isDeleting}
        onSaveAndList={handleSaveAndList}
        onSaveAndNew={handleSaveAndNew}
        onSaveAndEdit={handleSaveAndEdit}
        onBack={formPage.handleBack}
        onNew={isEditing ? formPage.handleNew : undefined}
        onClear={() => form.reset()}
        onToggleActive={isEditing && webhook
          ? () => formPage.handleToggleActive(isActive)
          : undefined
        }
        onDelete={isEditing ? formPage.handleDelete : undefined}
        entityLabel="webhook"
        recordLabel={webhook?.url}
      />
    ),
  });

  if (isEditing && isLoading) {
    return (
      <FormPageSkeleton
        panels={[
          { titleWidth: 'w-36', fields: 2, showBadge: true },
          { titleWidth: 'w-28', fields: 4, showBadge: false },
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
          <FormPanel
            title="Configuração"
            isActive={isEditing ? isActive : undefined}
          >
            <FormFieldGrid>
              {isEditing && id && (
                <FormFieldGridItem>
                  <FormRecordIdField id={id} />
                </FormFieldGridItem>
              )}
              <FormFieldGridItem span={isEditing ? 3 : 4}>
                <FormField control={form.control} name="url" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>URL do endpoint</FormLabel>
                    <FormControl>
                      <Input placeholder="https://meusite.com/webhook" {...field} />
                    </FormControl>
                    <FormDescription>O endpoint deve aceitar requisições POST com JSON.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem span={2}>
                <FormField control={form.control} name="secret" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="chave-secreta" {...field} />
                    </FormControl>
                    <FormDescription>Validação HMAC-SHA256 do payload.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
            </FormFieldGrid>
          </FormPanel>

          <FormPanel title="Eventos">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {WEBHOOK_EVENTS.map((event) => (
                <div key={event.value} className="flex items-center gap-2">
                  <Checkbox
                    id={event.value}
                    checked={events.includes(event.value)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('events');
                      if (checked) {
                        form.setValue('events', [...current, event.value], { shouldDirty: true });
                      } else {
                        form.setValue(
                          'events',
                          current.filter((e) => e !== event.value),
                          { shouldDirty: true },
                        );
                      }
                    }}
                  />
                  <label htmlFor={event.value} className="text-sm cursor-pointer">
                    {event.label}
                  </label>
                </div>
              ))}
            </div>
            {form.formState.errors.events && (
              <p className="mt-2 text-xs text-destructive">{form.formState.errors.events.message}</p>
            )}
          </FormPanel>
        </form>
      </Form>
    </PageBody>
  );
}
