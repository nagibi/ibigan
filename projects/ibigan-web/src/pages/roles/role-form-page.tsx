import { useCallback, useEffect, useLayoutEffect } from 'react';
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

const schema = z.object({
  name: z
    .string()
    .min(2, 'Nome é obrigatório.')
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use letras minúsculas, números e hífens (ex.: suporte-nivel-1).'),
  permissions: z.array(z.string()),
});

type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  name: '',
  permissions: [],
};

export function RoleFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);
  const canManage = useAuthStore((state) => state.hasPermission('permissao-gerenciar'));

  const { data: roleData, isLoading } = useQuery({
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
    entityLabel: 'papel',
    onDelete: isEditing && role && !role.is_system && canManage
      ? async () => {
          await rolesService.destroy(Number(id));
          queryClient.invalidateQueries({ queryKey: ['roles'] });
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
      apiNotify.showSuccess(isEditing ? 'Papel atualizado!' : 'Papel criado!');
      if (!isEditing && formPage.saveMode === 'new') {
        form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
      }
      const createdId = !isEditing ? response.data.result.id : undefined;
      navigate(resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/roles',
        newPath: '/roles/new',
        getEditPath: (recordId) => `/roles/${recordId}`,
        isEditing,
        createdId,
      }));
    },
    onError: (error: unknown) => {
      const handled = applyApiFormErrors(form, error);
      if (handled) {
        focusFirstFormError(form);
        return;
      }
      apiNotify.showError(
        isEditing ? 'Erro ao atualizar papel.' : 'Erro ao criar papel.',
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

  const handlePrimarySave = isEditing ? handleSaveAndList : handleSaveAndNew;

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

  const formAlert = useFormToolbarAlert(form.control, handleDiscard, {
    resetPhantomDirty: !isEditing ? resetCreateForm : undefined,
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
        onClear={handleClear}
        onDelete={isEditing && role && !role.is_system ? formPage.handleDelete : undefined}
        entityLabel="papel"
        recordLabel={role ? formatRoleName(role.name) : undefined}
        createdAt={role?.created_at}
        updatedAt={role?.updated_at}
      />
    ) : undefined,
  });

  if (!canManage) {
    return (
      <PageBody>
        <FormPanel title="Acesso restrito">
          <p className="text-sm text-muted-foreground">
            Você não tem permissão para gerenciar papéis.
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
          <FormPanel title="Identificação">
            {role && (
              <div className="mb-4 flex flex-wrap gap-2">
                {role.is_system && <Badge variant="outline">Sistema</Badge>}
                {role.permissions_locked && <Badge variant="secondary">Permissões bloqueadas</Badge>}
                <Badge variant="outline">{role.users_count} usuário(s)</Badge>
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
                    <FormLabel required>Nome do papel</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="suporte-nivel-1"
                        disabled={nameDisabled}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Identificador em minúsculas. Ex.: suporte-nivel-1
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
            </FormFieldGrid>
          </FormPanel>

          <FormPanel title="Permissões">
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
