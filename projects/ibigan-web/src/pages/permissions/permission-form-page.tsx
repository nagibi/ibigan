import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { focusFirstFormError } from '@/lib/focus-first-form-error';
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

const schema = (t: (key: string) => string) => z.object({
  name: z
    .string()
    .min(3, t('permissions.form.validation.name_required'))
    .max(255)
    .regex(/^[a-z0-9]+-[a-z0-9]+$/, t('permissions.form.validation.name_format')),
});

type FormData = z.infer<ReturnType<typeof schema>>;

const DEFAULT_VALUES: FormData = {
  name: '',
};

export function PermissionFormPage() {
  const { t } = useTranslation();
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
    newPath: '/permissions/new',
    entityLabel: t('permissions.entity'),
    onDelete: isEditing && canManage
      ? async () => {
          await permissionsService.destroy(Number(id));
          queryClient.invalidateQueries({ queryKey: ['permissions'] });
        }
      : undefined,
    notify: apiNotify,
  });

  const formSchema = useMemo(() => schema(t), [t]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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
      apiNotify.showSuccess(isEditing ? t('permissions.form.updated') : t('permissions.form.created'));
      if (!isEditing && formPage.saveMode === 'new') {
        form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
      }
      const createdId = !isEditing ? response.data.result.id : undefined;
      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/permissions',
        newPath: '/permissions/new',
        getEditPath: (recordId) => `/permissions/${recordId}`,
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
        isEditing ? t('permissions.form.error_update') : t('permissions.form.error_create'),
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

  const handlePrimarySave = handleSaveAndList;

  useFormKeyboard({
    enabled: canManage && (!isEditing || !isLoading),
    onSave: handlePrimarySave,
    isSubmitting: saveMutation.isPending,
  });

  const resetCreateForm = useCallback(
    () => form.reset(DEFAULT_VALUES, {
      keepDirty: false,
      keepErrors: false,
      keepTouched: false,
    }),
    [form],
  );

  const handleDiscard = useCallback(() => {
    if (isEditing && permission) {
      form.reset(
        { name: permission.name },
        { keepDirty: false, keepErrors: false, keepTouched: false },
      );
      return;
    }
    resetCreateForm();
  }, [form, isEditing, permission, resetCreateForm]);

  const handleClear = useCallback(() => {
    handleDiscard();
  }, [handleDiscard]);

  const formAlert = useFormToolbarAlert(form, {
    resetPhantomDirty: !isEditing ? resetCreateForm : undefined,
  });

  const pageTitle = formatFormPageTitle({
    isEditing,
    id,
    label: permission ? formatPermissionName(permission.name) : undefined,
    loading: isEditing && isLoading,
  });

  usePageToolbar({
    title: pageTitle,
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
        onNew={isEditing ? formPage.handleNew : undefined}
        onClear={handleClear}
        onDelete={isEditing ? formPage.handleDelete : undefined}
        entityLabel={t('permissions.entity')}
        recordLabel={permission ? formatPermissionName(permission.name) : undefined}
      />
    ) : undefined,
  });

  if (!canManage) {
    return (
      <PageBody>
        <FormPanel title={t('form.restricted_access')}>
          <p className="text-sm text-muted-foreground">
            {t('permissions.form.no_permission')}
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
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault();
            handlePrimarySave();
          }}
        >
          <FormPanel title={t('permissions.form.identification')}>
            <FormFieldGrid>
              {isEditing && id && (
                <FormFieldGridItem>
                  <FormRecordIdField id={id} />
                </FormFieldGridItem>
              )}
              <FormFieldGridItem span={isEditing ? 3 : 4}>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t('permissions.form.name')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('permissions.form.name_placeholder')} {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('permissions.form.name_help')}
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
