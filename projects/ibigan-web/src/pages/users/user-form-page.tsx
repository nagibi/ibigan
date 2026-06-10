import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import {
  normalizeUserProfilePayload,
  mapUserProfileToFormValues,
  userProfileFieldsSchema,
  USER_PROFILE_DEFAULT_VALUES,
} from '@/lib/user-profile-fields';
import { isUserActive, usersService } from '@/services/users.service';
import { UserProfileFields } from '@/components/profile/user-profile-fields';
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
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const createSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres.')
    .regex(/\d/, 'A senha deve conter pelo menos um número.'),
  password_confirmation: z.string(),
  role: z.string().min(1, 'Selecione um papel.'),
  ...userProfileFieldsSchema,
}).refine((d) => d.password === d.password_confirmation, {
  message: 'As senhas não coincidem.',
  path: ['password_confirmation'],
});

const editSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  role: z.string().min(1, 'Selecione um papel.'),
  ...userProfileFieldsSchema,
});

type CreateData = z.infer<typeof createSchema>;
type EditData = z.infer<typeof editSchema>;

const USER_ACTIVITY_LOG_TYPE = 'users';

const CREATE_DEFAULT_VALUES: CreateData = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  role: 'viewer',
  ...USER_PROFILE_DEFAULT_VALUES,
};

function formatLastLoginDate(value?: string | null) {
  if (!value) return '—';
  return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR });
}

function getAuditName(
  name?: string | null,
  ref?: { name: string } | null,
): string | null {
  return ref?.name ?? name ?? null;
}

export function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersService.show(Number(id)),
    enabled: isEditing,
  });

  const user = userData?.data.result;
  const isActive = user ? isUserActive(user) : true;

  const apiNotify = useApiToolbarAlert();

  const formPage = useFormPage({
    backPath: '/users',
    entityLabel: 'usuário',
    notify: apiNotify,
    onDelete: isEditing
      ? async () => {
          await usersService.destroy(Number(id));
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
      : undefined,
    onToggleActive: isEditing
      ? async (active) => {
          await usersService.toggleActive(Number(id), active);
          queryClient.invalidateQueries({ queryKey: ['user', id] });
          queryClient.invalidateQueries({ queryKey: ['users'] });
        }
      : undefined,
  });

  const createForm = useForm<CreateData>({
    resolver: zodResolver(createSchema),
    defaultValues: CREATE_DEFAULT_VALUES,
  });

  const editForm = useForm<EditData>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: '', email: '', role: 'viewer', ...USER_PROFILE_DEFAULT_VALUES },
  });

  const form = isEditing ? editForm : createForm;

  useLayoutEffect(() => {
    if (!isEditing) {
      createForm.reset(CREATE_DEFAULT_VALUES, {
        keepDirty: false,
        keepErrors: false,
        keepTouched: false,
      });
    }
  }, [isEditing, createForm, location.key]);

  useEffect(() => {
    if (!isEditing) {
      createForm.reset(CREATE_DEFAULT_VALUES, {
        keepDirty: false,
        keepErrors: false,
        keepTouched: false,
      });
    }
  }, [isEditing, createForm, location.key]);

  useEffect(() => {
    if (user) {
      editForm.reset(
        {
          ...mapUserProfileToFormValues(user),
          role: user.roles?.[0] ?? 'viewer',
        },
        { keepDirty: false, keepErrors: false },
      );
    }
  }, [user, editForm]);

  const saveMutation = useMutation({
    mutationFn: (data: CreateData | EditData) => {
      const payload = normalizeUserProfilePayload(data);
      return isEditing
        ? usersService.update(Number(id), payload as EditData)
        : usersService.store(payload as CreateData);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['user', id] });
      }
      apiNotify.showSuccess(isEditing ? 'Usuário atualizado!' : 'Usuário criado!');
      if (!isEditing && formPage.saveMode === 'new') {
        createForm.reset(CREATE_DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
      }
      const createdId = !isEditing ? response.data.result.id : undefined;
      navigate(resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/users',
        newPath: '/users/new',
        getEditPath: (recordId) => `/users/${recordId}`,
        isEditing,
        createdId,
      }));
    },
    onError: (error: unknown) => {
      const handled = applyApiFormErrors(form, error);
      if (!handled) {
        apiNotify.showError(
          isEditing ? 'Erro ao atualizar usuário.' : 'Erro ao criar usuário.',
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
    enabled: !isEditing || !isLoading,
    onSave: handlePrimarySave,
    isSubmitting: saveMutation.isPending,
  });

  const resetCreateForm = useCallback(
    () => createForm.reset(CREATE_DEFAULT_VALUES, {
      keepDirty: false,
      keepErrors: false,
      keepTouched: false,
    }),
    [createForm],
  );

  const handleDiscard = useCallback(
    () => form.reset(undefined, { keepDirty: false, keepErrors: false, keepTouched: false }),
    [form],
  );

  const formAlert = useFormToolbarAlert(form.control, handleDiscard, {
    resetPhantomDirty: !isEditing ? resetCreateForm : undefined,
  });

  const pageAlert = useMemo(
    () => mergeToolbarAlerts(
      formAlert,
      isEditing && user && !isActive ? buildInactiveAlert('usuário') : null,
    ),
    [formAlert, isActive, isEditing, user],
  );

  const pageTitle = formatFormPageTitle({
    isEditing,
    id,
    label: user?.name,
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
        onClear={() => form.reset()}
        onToggleActive={isEditing && user
          ? () => formPage.handleToggleActive(isActive)
          : undefined
        }
        onDelete={isEditing ? formPage.handleDelete : undefined}
        entityLabel="usuário"
        recordLabel={user?.name}
        activityLog={isEditing && id
          ? { subjectType: USER_ACTIVITY_LOG_TYPE, subjectId: Number(id) }
          : undefined
        }
        createdBy={getAuditName(user?.created_by_name, user?.created_by)}
        createdAt={user?.created_at}
        updatedBy={getAuditName(user?.updated_by_name, user?.updated_by)}
        updatedAt={user?.updated_at}
      />
    ),
  });

  if (isEditing && isLoading) {
    return (
      <FormPageSkeleton
        panels={[
          { titleWidth: 'w-36', fields: 6, showBadge: true },
          { titleWidth: 'w-32', fields: 3 },
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
          <FormPanel
            title="Dados pessoais"
            isActive={isEditing ? isActive : undefined}
          >
            <FormFieldGrid>
              {isEditing && id && (
                <FormFieldGridItem>
                  <FormRecordIdField id={id} />
                </FormFieldGridItem>
              )}
              <UserProfileFields control={form.control} />
              <FormFieldGridItem>
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Papel</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        if (value !== field.value) field.onChange(value);
                      }}
                      value={field.value}
                    >
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
            </FormFieldGrid>
          </FormPanel>

          {isEditing && user && (
            <FormPanel title="Último acesso">
              <FormFieldGrid>
                <FormFieldGridItem>
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input readOnly value={formatLastLoginDate(user.last_login_at)} className="bg-muted" />
                    </FormControl>
                  </FormItem>
                </FormFieldGridItem>
                <FormFieldGridItem>
                  <FormItem>
                    <FormLabel>IP</FormLabel>
                    <FormControl>
                      <Input readOnly value={user.last_login_ip ?? '—'} className="bg-muted font-mono text-sm" />
                    </FormControl>
                  </FormItem>
                </FormFieldGridItem>
                <FormFieldGridItem span={2}>
                  <FormItem>
                    <FormLabel>Dispositivo</FormLabel>
                    <FormControl>
                      <Input readOnly value={user.last_login_device ?? '—'} className="bg-muted" />
                    </FormControl>
                  </FormItem>
                </FormFieldGridItem>
              </FormFieldGrid>
            </FormPanel>
          )}

          {!isEditing && (
            <FormPanel title="Senha">
              <FormFieldGrid>
                <FormFieldGridItem span={2}>
                  <FormField control={createForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </FormFieldGridItem>
                <FormFieldGridItem span={2}>
                  <FormField control={createForm.control} name="password_confirmation" render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Confirmar senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Repita a senha"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </FormFieldGridItem>
              </FormFieldGrid>
            </FormPanel>
          )}
        </form>
      </Form>
    </PageBody>
  );
}
