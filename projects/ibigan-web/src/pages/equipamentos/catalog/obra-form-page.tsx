import { useCallback, useLayoutEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { z } from 'zod';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import {
  mapObraToFormValues,
  obraCatalogFormSchema,
} from '@/lib/equipamento-catalog-form-schema';
import { focusFirstFormError } from '@/lib/focus-first-form-error';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useFormKeyboard } from '@/hooks/use-form-keyboard';
import { useFormPage } from '@/hooks/use-form-page';
import { useFormRefresh } from '@/hooks/use-form-refresh';
import { useFormToolbarAlert } from '@/hooks/use-form-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { obrasCatalogService } from '@/services/equipamento-catalog.service';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PageBody } from '@/components/common/page-body';
import {
  FormFieldGrid,
  FormFieldGridItem,
} from '@/components/grid/form-field-grid';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';
import { FormPanel } from '@/components/grid/form-panel';
import { FormRecordIdField } from '@/components/grid/form-record-identifier';
import { FormToolbar } from '@/components/grid/form-toolbar';
import {
  buildInactiveAlert,
  mergeToolbarAlerts,
} from '@/components/grid/toolbar-alert';
import { EquipamentoUserSelect } from '@/pages/equipamentos/components/equipamento-user-select';

const schema = obraCatalogFormSchema;
type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  codigo: '',
  nome: '',
  endereco: '',
  responsavel_user_id: '',
};

export function ObraFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const apiNotify = useApiToolbarAlert();

  const {
    data: obraData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['equipamentos', 'obra', id],
    queryFn: () => obrasCatalogService.show(Number(id)),
    enabled: isEditing,
  });

  const obra = obraData?.data.result;
  const isActive = obra?.is_ativa ?? true;

  const formPage = useFormPage({
    backPath: '/equipamentos/obras',
    newPath: '/equipamentos/obras/new',
    entityLabel: 'Obra',
    notify: apiNotify,
    onDelete: isEditing
      ? async () => {
          await obrasCatalogService.destroy(Number(id));
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos', 'obras'],
          });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos-lookups', 'obras'],
          });
        }
      : undefined,
    onToggleActive: isEditing
      ? async (active) => {
          await obrasCatalogService.update(Number(id), { is_ativa: active });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos', 'obra', id],
          });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos', 'obras'],
          });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos-lookups', 'obras'],
          });
        }
      : undefined,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useLayoutEffect(() => {
    if (!isEditing || !obra) return;

    form.reset(mapObraToFormValues(obra), {
      keepDirty: false,
      keepErrors: false,
    });
  }, [isEditing, obra, form]);

  useLayoutEffect(() => {
    if (!isEditing) {
      form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
    }
  }, [isEditing, form, location.key]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        codigo: data.codigo.trim(),
        nome: data.nome.trim(),
        endereco: data.endereco?.trim() || null,
        responsavel_user_id: data.responsavel_user_id
          ? Number(data.responsavel_user_id)
          : null,
        is_ativa: isEditing ? isActive : true,
      };

      return isEditing
        ? obrasCatalogService.update(Number(id), payload)
        : obrasCatalogService.store(payload);
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['equipamentos', 'obras'] });
      await queryClient.invalidateQueries({
        queryKey: ['equipamentos-lookups', 'obras'],
      });

      if (isEditing) {
        await queryClient.invalidateQueries({
          queryKey: ['equipamentos', 'obra', id],
        });
      }

      const createdId = !isEditing ? response.data.result.id : undefined;
      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/equipamentos/obras',
        newPath: '/equipamentos/obras/new',
        getEditPath: (recordId) => `/equipamentos/obras/${recordId}`,
        isEditing,
        createdId,
      });
      if (nextPath) navigate(nextPath);
    },
    onError: (error: unknown) => {
      const handled = applyApiFormErrors(form, error);
      if (handled) {
        focusFirstFormError(form);
        return;
      }
      apiNotify.showError(
        isEditing ? 'Erro ao atualizar obra.' : 'Erro ao criar obra.',
        error,
      );
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

  useFormKeyboard({
    enabled: !isEditing || !isLoading,
    onSave: handleSaveAndList,
    isSubmitting: saveMutation.isPending,
  });

  const formAlert = useFormToolbarAlert(form);
  const formRefresh = useFormRefresh({
    isEditing,
    isDirty: form.formState.isDirty,
    isFetching: isEditing && isFetching,
    refetch: isEditing ? () => void refetch() : undefined,
  });

  const pageTitle = formatFormPageTitle({
    isEditing,
    id,
    label: obra?.codigo,
    loading: isEditing && isLoading,
  });

  const pageAlert = useMemo(
    () =>
      mergeToolbarAlerts(
        formAlert,
        isEditing && !isActive ? buildInactiveAlert('record') : null,
      ),
    [formAlert, isActive, isEditing],
  );

  usePageToolbar({
    title: pageTitle,
    alert: pageAlert,
    breadcrumbs: [
      { title: 'Equipamentos', path: '/equipamentos' },
      { title: 'Obras', path: '/equipamentos/obras' },
      { title: pageTitle },
    ],
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
        onClear={() =>
          form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false })
        }
        onRefresh={formRefresh.onRefresh}
        isRefreshing={formRefresh.isRefreshing}
        onToggleActive={
          isEditing && obra
            ? () => formPage.handleToggleActive(isActive)
            : undefined
        }
        onDelete={isEditing ? formPage.handleDelete : undefined}
        entityLabel="obra"
        recordLabel={obra?.codigo}
      />
    ),
  });

  if (isEditing && isLoading) {
    return (
      <FormPageSkeleton
        panels={[{ titleWidth: 'w-36', fields: 4, showBadge: true }]}
      />
    );
  }

  return (
    <PageBody>
      <Form {...form}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveAndList();
          }}
        >
          <FormPanel
            title="Informações básicas"
            isActive={isEditing ? isActive : undefined}
          >
            <FormFieldGrid columns={12}>
              {isEditing ? (
                <FormFieldGridItem md={3}>
                  <FormRecordIdField id={obra!.id} />
                </FormFieldGridItem>
              ) : null}

              <FormFieldGridItem md={3}>
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: 651" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>

              <FormFieldGridItem md={isEditing ? 6 : 9}>
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da obra" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>

              <FormFieldGridItem md={6}>
                <FormField
                  control={form.control}
                  name="responsavel_user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável</FormLabel>
                      <FormControl>
                        <EquipamentoUserSelect
                          value={field.value}
                          placeholder="Selecione o usuário"
                          onSelect={(user) => field.onChange(String(user.id))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>

              <FormFieldGridItem md={6}>
                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>
            </FormFieldGrid>
          </FormPanel>
        </form>
      </Form>
    </PageBody>
  );
}
