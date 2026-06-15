import { useCallback, useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useFormKeyboard } from '@/hooks/use-form-keyboard';
import { useFormPage } from '@/hooks/use-form-page';
import { useFormRefresh } from '@/hooks/use-form-refresh';
import { useFormToolbarAlert } from '@/hooks/use-form-toolbar-alert';
import { digitsOnly } from '@/lib/brazilian-masks';
import { adminTenantsService } from '@/services/admin-tenants.service';
import { FormToolbar } from '@/components/grid/form-toolbar';
import { PageBody } from '@/components/common/page-body';
import { FormFieldGrid, FormFieldGridItem } from '@/components/grid/form-field-grid';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';
import { FormPanel } from '@/components/grid/form-panel';
import { FormRecordIdField } from '@/components/grid/form-record-identifier';
import { FormSwitchControl } from '@/components/grid/form-switch-control';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  cnpj: z.string().optional(),
  timezone: z.string().min(1, 'Selecione um fuso horário.'),
  locale: z.string().min(1, 'Selecione um idioma.'),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  name: '',
  cnpj: '',
  timezone: 'UTC',
  locale: 'pt_BR',
  is_active: true,
};

function toPayload(values: FormData) {
  const cnpj = digitsOnly(values.cnpj ?? '');

  return {
    name: values.name,
    cnpj: cnpj || null,
    timezone: values.timezone,
    locale: values.locale,
    is_active: values.is_active,
  };
}

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Belem', label: 'Belém (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
];

const LOCALES = [
  { value: 'pt_BR', label: 'Português (Brasil)' },
  { value: 'en', label: 'English' },
];

export function AdminTenantFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const apiNotify = useApiToolbarAlert();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-tenant', id],
    queryFn: () => adminTenantsService.show(id!),
    enabled: isEditing,
  });

  const tenant = data?.data.result;

  const formPage = useFormPage({
    backPath: '/admin/tenants',
    newPath: '/admin/tenants/new',
    entityKey: 'tenant',
    notify: apiNotify,
    onDelete: isEditing
      ? async () => {
          await adminTenantsService.destroy(id!);
          queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
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
    if (tenant) {
      form.reset(
        {
          name: tenant.name ?? '',
          cnpj: tenant.cnpj ?? '',
          timezone: tenant.timezone,
          locale: tenant.locale,
          is_active: tenant.is_active,
        },
        { keepDirty: false, keepErrors: false },
      );
    }
  }, [tenant, form]);

  const saveMutation = useMutation({
    mutationFn: (values: FormData) =>
      isEditing
        ? adminTenantsService.update(id!, toPayload(values))
        : adminTenantsService.store(toPayload(values)),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] });
      }
      apiNotify.showSuccess(isEditing ? 'Empresa atualizada com sucesso!' : 'Empresa criada com sucesso!');

      if (!isEditing && formPage.saveMode === 'new') {
        form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
        return;
      }

      if (!isEditing && formPage.saveMode === 'edit') {
        navigate(`/admin/tenants/${response.data.result.id}`);
        return;
      }

      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/admin/tenants',
        newPath: '/admin/tenants/new',
        getEditPath: () => `/admin/tenants/${id}`,
        isEditing,
      });
      if (nextPath) navigate(nextPath);
    },
    onError: (error: unknown) => {
      const handled = applyApiFormErrors(form, error);
      if (!handled) {
        apiNotify.showError(
          isEditing ? 'Erro ao atualizar empresa.' : 'Erro ao criar empresa.',
          error,
        );
      }
    },
  });

  const handleSaveAndList = useCallback(() => {
    formPage.setSaveMode('list');
    void form.handleSubmit((values) => saveMutation.mutate(values))();
  }, [form, formPage, saveMutation]);

  const handleSaveAndNew = useCallback(() => {
    formPage.setSaveMode('new');
    void form.handleSubmit((values) => saveMutation.mutate(values))();
  }, [form, formPage, saveMutation]);

  const handleSaveAndEdit = useCallback(() => {
    formPage.setSaveMode('edit');
    void form.handleSubmit((values) => saveMutation.mutate(values))();
  }, [form, formPage, saveMutation]);

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

  const pageTitle = formatFormPageTitle({
    isEditing,
    id,
    label: tenant?.name,
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
        onClear={() => form.reset(isEditing && tenant ? {
          name: tenant.name ?? '',
          cnpj: tenant.cnpj ?? '',
          timezone: tenant.timezone,
          locale: tenant.locale,
          is_active: tenant.is_active,
        } : DEFAULT_VALUES)}
        onRefresh={formRefresh.onRefresh}
        isRefreshing={formRefresh.isRefreshing}
        onDelete={isEditing ? formPage.handleDelete : undefined}
        entityLabel="empresa"
        recordLabel={tenant?.name ?? undefined}
      />
    ),
  });

  if (isEditing && isLoading) {
    return (
      <FormPageSkeleton
        panels={[{ titleWidth: 'w-40', fields: 4 }]}
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
          <FormPanel title="Dados da empresa">
            <FormFieldGrid>
              {isEditing && id && (
                <FormFieldGridItem>
                  <FormRecordIdField id={id} />
                </FormFieldGridItem>
              )}
              <FormFieldGridItem className="sm:col-span-2">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Minha Empresa SA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <FormControl>
                      <MaskedInput mask="cnpj" placeholder="00.000.000/0000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField control={form.control} name="is_active" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ativo</FormLabel>
                    <FormControl>
                      <FormSwitchControl checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField control={form.control} name="timezone" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Fuso horário</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIMEZONES.map((timezone) => (
                          <SelectItem key={timezone.value} value={timezone.value}>
                            {timezone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField control={form.control} name="locale" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Idioma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOCALES.map((locale) => (
                          <SelectItem key={locale.value} value={locale.value}>
                            {locale.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              {isEditing && tenant && (
                <FormFieldGridItem>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Slug</p>
                    <Input value={tenant.slug} disabled readOnly className="bg-muted font-mono text-sm" />
                  </div>
                </FormFieldGridItem>
              )}
            </FormFieldGrid>
          </FormPanel>
        </form>
      </Form>
    </PageBody>
  );
}
