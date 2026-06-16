import { useCallback, useLayoutEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { z } from 'zod';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import {
  mapTipoToFormValues,
  tipoCatalogFormSchema,
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
import { tiposCatalogService } from '@/services/equipamento-catalog.service';
import { equipamentosService } from '@/services/equipamentos.service';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

const schema = tipoCatalogFormSchema;
type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  nome: '',
  grupo_id: '',
};

export function TipoFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const apiNotify = useApiToolbarAlert();

  const {
    data: tipoData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['equipamentos', 'tipo', id],
    queryFn: () => tiposCatalogService.show(Number(id)),
    enabled: isEditing,
  });

  const { data: grupos = [] } = useQuery({
    queryKey: ['equipamentos-lookups', 'grupos'],
    queryFn: () => equipamentosService.lookupGrupos(),
    staleTime: 60_000,
  });

  const tipo = tipoData?.data.result;
  const isActive = tipo?.is_ativo ?? true;

  const formPage = useFormPage({
    backPath: '/equipamentos/tipos',
    newPath: '/equipamentos/tipos/new',
    entityLabel: 'Tipo',
    notify: apiNotify,
    onDelete: isEditing
      ? async () => {
          await tiposCatalogService.destroy(Number(id));
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos', 'tipos'],
          });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos-lookups', 'tipos'],
          });
        }
      : undefined,
    onToggleActive: isEditing
      ? async (active) => {
          await tiposCatalogService.update(Number(id), { is_ativo: active });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos', 'tipo', id],
          });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos', 'tipos'],
          });
          await queryClient.invalidateQueries({
            queryKey: ['equipamentos-lookups', 'tipos'],
          });
        }
      : undefined,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useLayoutEffect(() => {
    if (!isEditing || !tipo) return;

    form.reset(mapTipoToFormValues(tipo), {
      keepDirty: false,
      keepErrors: false,
    });
  }, [isEditing, tipo, form]);

  useLayoutEffect(() => {
    if (!isEditing) {
      form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
    }
  }, [isEditing, form, location.key]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        nome: data.nome.trim(),
        grupo_id: Number(data.grupo_id),
        is_ativo: isEditing ? isActive : true,
      };

      return isEditing
        ? tiposCatalogService.update(Number(id), payload)
        : tiposCatalogService.store(payload);
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: ['equipamentos', 'tipos'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['equipamentos-lookups', 'tipos'],
      });

      if (isEditing) {
        await queryClient.invalidateQueries({
          queryKey: ['equipamentos', 'tipo', id],
        });
      }

      const createdId = !isEditing ? response.data.result.id : undefined;
      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/equipamentos/tipos',
        newPath: '/equipamentos/tipos/new',
        getEditPath: (recordId) => `/equipamentos/tipos/${recordId}`,
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
        isEditing ? 'Erro ao atualizar tipo.' : 'Erro ao criar tipo.',
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
    label: tipo?.nome,
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
      { title: 'Tipos', path: '/equipamentos/tipos' },
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
          isEditing && tipo
            ? () => formPage.handleToggleActive(isActive)
            : undefined
        }
        onDelete={isEditing ? formPage.handleDelete : undefined}
        entityLabel="tipo"
        recordLabel={tipo?.nome}
      />
    ),
  });

  if (isEditing && isLoading) {
    return (
      <FormPageSkeleton
        panels={[{ titleWidth: 'w-36', fields: 3, showBadge: true }]}
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
                  <FormRecordIdField id={tipo!.id} />
                </FormFieldGridItem>
              ) : null}
              <FormFieldGridItem md={3}>
                <FormField
                  control={form.control}
                  name="grupo_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Grupo</FormLabel>
                      <Select
                        key={field.value}
                        onValueChange={field.onChange}
                        value={field.value || undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o grupo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {grupos.map((grupo) => (
                            <SelectItem key={grupo.id} value={String(grupo.id)}>
                              {grupo.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                        <Input placeholder="Nome do tipo" {...field} />
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
