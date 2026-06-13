import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { formatRoleName } from '@/lib/role-permission-labels';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import { permissionsService } from '@/services/permissions.service';
import { rolesService } from '@/services/roles.service';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useFormKeyboard } from '@/hooks/use-form-keyboard';
import { useFormPage } from '@/hooks/use-form-page';
import { useFormRefresh } from '@/hooks/use-form-refresh';
import { useFormToolbarAlert } from '@/hooks/use-form-toolbar-alert';
import { focusFirstFormError } from '@/lib/focus-first-form-error';
import { useAuthStore } from '@/stores/auth.store';
import { RolePermissionsPanel } from '@/components/roles/role-permissions-panel';
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
import { Badge } from '@/components/ui/badge';

const schema = (t: (key: string) => string) => z.object({
  name: z
    .string()
    .min(2, t('roles.form.validation.name_required'))
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, t('roles.form.validation.name_format')),
  permissions: z.array(z.string()),
});

type FormData = z.infer<ReturnType<typeof schema>>;

const DEFAULT_VALUES: FormData = {
  name: '',
  permissions: [],
};

export function RoleFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const canManage = useAuthStore((state) => state.hasPermission('permissao-gerenciar'));

  const { data: roleData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['role', id],
    queryFn: () => rolesService.show(Number(id)),
    enabled: isEditing,
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionsService.list(),
  });

  const role = roleData?.data.result;
  const allPermissions = permissionsData?.data.result ?? [];
  const apiNotify = useApiToolbarAlert();

  const formPage = useFormPage({
    backPath: '/roles',
    newPath: '/roles/new',
    entityLabel: t('roles.entity'),
    onDelete: isEditing && role && !role.is_system && canManage
      ? async () => {
          await rolesService.destroy(Number(id));
          queryClient.invalidateQueries({ queryKey: ['roles'] });
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
    if (role) {
      form.reset(
        {
          name: role.name,
          permissions: role.permissions,
        },
        { keepDirty: false, keepErrors: false },
      );
    }
  }, [role, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!canManage) {
        throw new Error('forbidden');
      }

      if (isEditing) {
        const currentRole = role!;
        const requests: Promise<unknown>[] = [];

        if (!currentRole.is_system && data.name !== currentRole.name) {
          requests.push(rolesService.update(Number(id), { name: data.name }));
        }

        if (!currentRole.permissions_locked) {
          const currentPermissions = [...currentRole.permissions].sort().join(',');
          const nextPermissions = [...data.permissions].sort().join(',');
          if (currentPermissions !== nextPermissions) {
            requests.push(rolesService.syncPermissions(Number(id), data.permissions));
          }
        }

        if (requests.length > 0) {
          await Promise.all(requests);
        }

        return rolesService.show(Number(id));
      }

      return rolesService.store({
        name: data.name,
        permissions: data.permissions,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['role', id] });
      }
      apiNotify.showSuccess(isEditing ? t('roles.form.updated') : t('roles.form.created'));
      if (!isEditing && formPage.saveMode === 'new') {
        form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
      }
      const createdId = !isEditing ? response.data.result.id : undefined;
      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/roles',
        newPath: '/roles/new',
        getEditPath: (recordId) => `/roles/${recordId}`,
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
        isEditing ? t('roles.form.error_update') : t('roles.form.error_create'),
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
    if (isEditing && role) {
      form.reset(
        { name: role.name, permissions: role.permissions },
        { keepDirty: false, keepErrors: false, keepTouched: false },
      );
      return;
    }
    resetCreateForm();
  }, [form, isEditing, resetCreateForm, role]);

  const handleClear = useCallback(() => {
    handleDiscard();
  }, [handleDiscard]);

  const formAlert = useFormToolbarAlert(form, {
    resetPhantomDirty: !isEditing ? resetCreateForm : undefined,
  });

  const formRefresh = useFormRefresh({
    isEditing,
    isDirty: form.formState.isDirty,
    isFetching: isEditing && isFetching,
    refetch: isEditing ? () => refetch() : undefined,
    onReset: !isEditing ? resetCreateForm : undefined,
  });

  const pageTitle = formatFormPageTitle({
    isEditing,
    id,
    label: role ? formatRoleName(role.name) : undefined,
    loading: isEditing && isLoading,
  });

  const nameDisabled = isEditing && Boolean(role?.is_system);
  const permissionsDisabled = isEditing && Boolean(role?.permissions_locked);

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
        onRefresh={formRefresh.onRefresh}
        isRefreshing={formRefresh.isRefreshing}
        onDelete={isEditing && role && !role.is_system ? formPage.handleDelete : undefined}
        entityLabel={t('roles.entity')}
        recordLabel={role ? formatRoleName(role.name) : undefined}
        createdAt={role?.created_at}
        updatedAt={role?.updated_at}
      />
    ) : undefined,
  });

  if (!canManage) {
    return (
      <PageBody>
        <FormPanel title={t('form.restricted_access')}>
          <p className="text-sm text-muted-foreground">
            {t('roles.form.no_permission')}
          </p>
        </FormPanel>
      </PageBody>
    );
  }

  if (isEditing && isLoading) {
    return (
      <FormPageSkeleton
        panels={[
          { titleWidth: 'w-36', fields: 2, showBadge: true },
          { titleWidth: 'w-40', fields: 6, showBadge: false },
        ]}
      />
    );
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
          <FormPanel title={t('roles.form.identification')}>
            {role && (
              <div className="mb-4 flex flex-wrap gap-2">
                {role.is_system && <Badge variant="outline">{t('roles.type.system')}</Badge>}
                {role.permissions_locked && <Badge variant="secondary">{t('roles.form.permissions_locked')}</Badge>}
                <Badge variant="outline">{t('roles.form.users_count', { count: role.users_count })}</Badge>
              </div>
            )}
            <FormFieldGrid>
              {isEditing && id && (
                <FormFieldGridItem>
                  <FormRecordIdField id={id} />
                </FormFieldGridItem>
              )}
              <FormFieldGridItem span={isEditing ? 3 : 4}>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t('roles.form.name')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('roles.form.name_placeholder')}
                        disabled={nameDisabled}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('roles.form.name_help')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
            </FormFieldGrid>
          </FormPanel>

          <FormPanel title={t('roles.form.permissions_panel')}>
            <FormField
              control={form.control}
              name="permissions"
              render={({ field }) => (
                <FormItem>
                  <RolePermissionsPanel
                    allPermissions={allPermissions}
                    selected={field.value}
                    disabled={permissionsDisabled}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormPanel>
        </form>
      </Form>
    </PageBody>
  );
}
