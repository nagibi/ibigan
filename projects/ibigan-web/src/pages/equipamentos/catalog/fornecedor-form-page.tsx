import { useCallback, useLayoutEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { z } from 'zod';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import {
  fornecedorCatalogFormSchema,
  mapFornecedorToFormValues,
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
import { fornecedoresCatalogService } from '@/services/equipamento-catalog.service';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { MaskedInput } from '@/components/ui/masked-input';
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

const schema = fornecedorCatalogFormSchema;
type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  nome: '',
  cnpj: '',
  telefone: '',
  email: '',
  contato_responsavel: '',
};

export function FornecedorFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const apiNotify = useApiToolbarAlert();

  const {
    data: fornecedorData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['equipamentos', 'fornecedor', id],
    queryFn: () => fornecedoresCatalogService.show(Number(id)),
    enabled: isEditing,
  });

  const fornecedor = fornecedorData?.data.result;
  const isActive = fornecedor?.is_ativo ?? true;

  const formPage = useFormPage({
    backPath: '/equipamentos/fornecedores',
    newPath: '/equipamentos/fornecedores/new',
    entityLabel: 'Fornecedor',
    notify: apiNotify,
    onDelete: isEditing
      ? async () => {
          await fornecedoresCatalogService.destroy(Number(id));
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos', 'fornecedores'],
          });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos-lookups', 'fornecedores'],
          });
        }
      : undefined,
    onToggleActive: isEditing
      ? async (active) => {
          await fornecedoresCatalogService.update(Number(id), {
            is_ativo: active,
          });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos', 'fornecedor', id],
          });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos', 'fornecedores'],
          });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos-lookups', 'fornecedores'],
          });
        }
      : undefined,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useLayoutEffect(() => {
    if (!isEditing || !fornecedor) return;

    form.reset(mapFornecedorToFormValues(fornecedor), {
      keepDirty: false,
      keepErrors: false,
    });
  }, [isEditing, fornecedor, form]);

  useLayoutEffect(() => {
    if (!isEditing) {
      form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
    }
  }, [isEditing, form, location.key]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        nome: data.nome.trim(),
        cnpj: data.cnpj?.trim() || null,
        telefone: data.telefone?.trim() || null,
        email: data.email?.trim() || null,
        contato_responsavel: data.contato_responsavel?.trim() || null,
        is_ativo: isEditing ? isActive : true,
      };

      return isEditing
        ? fornecedoresCatalogService.update(Number(id), payload)
        : fornecedoresCatalogService.store(payload);
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ['equipamentos', 'fornecedores'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['equipamentos-lookups', 'fornecedores'],
      });

      if (isEditing) {
        await queryClient.invalidateQueries({
          queryKey: ['equipamentos', 'fornecedor', id],
        });
      }

      const createdId = !isEditing ? response.data.result.id : undefined;
      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/equipamentos/fornecedores',
        newPath: '/equipamentos/fornecedores/new',
        getEditPath: (recordId) => `/equipamentos/fornecedores/${recordId}`,
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
        isEditing
          ? 'Erro ao atualizar fornecedor.'
          : 'Erro ao criar fornecedor.',
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
    label: fornecedor?.nome,
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
      { title: 'Fornecedores', path: '/equipamentos/fornecedores' },
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
          isEditing && fornecedor
            ? () => formPage.handleToggleActive(isActive)
            : undefined
        }
        onDelete={isEditing ? formPage.handleDelete : undefined}
        entityLabel="fornecedor"
        recordLabel={fornecedor?.nome}
      />
    ),
  });

  if (isEditing && isLoading) {
    return (
      <FormPageSkeleton
        panels={[{ titleWidth: 'w-40', fields: 3, showBadge: true }]}
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
                  <FormRecordIdField id={fornecedor!.id} />
                </FormFieldGridItem>
              ) : null}

              <FormFieldGridItem md={isEditing ? 9 : 12}>
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do fornecedor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>

              <FormFieldGridItem md={3}>
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <FormControl>
                        <MaskedInput
                          mask="cnpj"
                          placeholder="00.000.000/0000-00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>

              <FormFieldGridItem md={3}>
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <MaskedInput
                          mask="phone"
                          placeholder="(00) 00000-0000"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>

              <FormFieldGridItem md={3}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="email@exemplo.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>

              <FormFieldGridItem md={3}>
                <FormField
                  control={form.control}
                  name="contato_responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contato responsável</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do contato" {...field} />
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
