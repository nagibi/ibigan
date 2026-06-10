import { useCallback, useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { formatPermissionName } from '@/lib/role-permission-labels';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import { permissionsService } from '@/services/permissions.service';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useFormKeyboard } from '@/hooks/use-form-keyboard';
import { useFormPage } from '@/hooks/use-form-page';
import { useFormToolbarAlert } from '@/hooks/use-form-toolbar-alert';
import { useAuthStore } from '@/stores/auth.store';
import { FormToolbar } from '@/components/grid/form-toolbar';
import { PageBody } from '@/components/common/page-body';
import { FormFieldGrid, FormFieldGridItem } from '@/components/grid/form-field-grid';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';
import { FormPanel } from '@/components/grid/form-panel';
import { FormRecordIdField } from '@/components/grid/form-record-identifier';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form';

const schema = z.object({
  name: z
    .string()
    .min(3, 'Nome é obrigatório.')
    .max(255)
    .regex(/^[a-z0-9]+-[a-z0-9]+$/, 'Use o formato recurso-ação (ex.: usuario-visualizar).'),
});

type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  name: '',
};

export function PermissionFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const canManage = useAuthStore((state) => state.hasPermission('permissao-gerenciar'));

  const { data: permissionData, isLoading } = useQuery({
    queryKey: ['permission', id],
    queryFn: () => permissionsService.show(Number(id)),
    enabled: isEditing,
  });

  const permission = permissionData?.data.result;
  const apiNotify = useApiToolbarAlert();

  const formPage = useFormPage({
    backPath: '/permissions',
    entityLabel: 'permissão',
    onDelete: isEditing && canManage
      ? async () => {
          await permissionsService.destroy(Number(id));
          queryClient.invalidateQueries({ queryKey: ['permissions'] });
        }
      : undefined,
    notify: apiNotify,
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
    if (permission) {
      form.reset({ name: permission.name }, { keepDirty: false, keepErrors: false });
    }
  }, [permission, form]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => (
      isEditing
        ? permissionsService.update(Number(id), data)
        : permissionsService.store(data)
    ),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['permission', id] });
      }
      apiNotify.showSuccess(isEditing ? 'Permissão atualizada!' : 'Permissão criada!');
      if (!isEditing && formPage.saveMode === 'new') {
        form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
      }
      const createdId = !isEditing ? response.data.result.id : undefined;
      navigate(resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/permissions',
        newPath: '/permissions/new',
        getEditPath: (recordId) => `/permissions/${recordId}`,
        isEditing,
        createdId,
      }));
    },
    onError: (error: unknown) => {
      const handled = applyApiFormErrors(form, error);
      if (!handled) {
        apiNotify.showError(
          isEditing ? 'Erro ao atualizar permissão.' : 'Erro ao criar permissão.',
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

  const handlePrimarySave = isEditing ? handleSaveAndList : handleSaveAndNew;

  useFormKeyboard({
    enabled: canManage && (!isEditing || !isLoading),
    onSave: handlePrimarySave,
    isSubmitting: saveMutation.isPending,
  });

  const handleDiscard = useCallback(
    () => form.reset(undefined, { keepDirty: false, keepErrors: false }),
    [form],
  );
  const formAlert = useFormToolbarAlert(form.control, handleDiscard);

  const pageTitle = formatFormPageTitle({
    isEditing,
    id,
    label: permission ? formatPermissionName(permission.name) : undefined,
    loading: isEditing && isLoading,
  });

  usePageToolbar({
    title: pageTitle,
    description: isEditing
      ? 'Edite o identificador da permissão.'
      : 'Cadastre uma nova permissão no catálogo.',
    alert: formAlert,
    actions: canManage ? (
      <FormToolbar
        isEditing={isEditing}
        isDirty={form.formState.isDirty}
        isSubmitting={saveMutation.isPending}
        isDeleting={formPage.isDeleting}
        onSaveAndList={handleSaveAndList}
        onSaveAndNew={handleSaveAndNew}
        onSaveAndEdit={handleSaveAndEdit}
        onBack={formPage.handleBack}
        onClear={() => form.reset()}
        onDelete={isEditing ? formPage.handleDelete : undefined}
        entityLabel="permissão"
        recordLabel={permission ? formatPermissionName(permission.name) : undefined}
      />
    ) : undefined,
  });

  if (!canManage) {
    return (
      <PageBody>
        <FormPanel title="Acesso restrito">
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para gerenciar permissões.
          </p>
        </FormPanel>
      </PageBody>
    );
  }

  if (isEditing && isLoading) {
    return <FormPageSkeleton panels={[{ titleWidth: 'w-40', fields: 1 }]} />;
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
          <FormPanel title="Identificação">
            <FormFieldGrid>
              {isEditing && id && (
                <FormFieldGridItem>
                  <FormRecordIdField id={id} />
                </FormFieldGridItem>
              )}
              <FormFieldGridItem span={isEditing ? 3 : 4}>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Nome da permissão</FormLabel>
                    <FormControl>
                      <Input placeholder="usuario-visualizar" {...field} />
                    </FormControl>
                    <FormDescription>
                      Formato recurso-ação em minúsculas. Ex.: relatorio-gerenciar
                    </FormDescription>
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
