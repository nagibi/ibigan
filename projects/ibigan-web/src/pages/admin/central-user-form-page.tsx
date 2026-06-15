import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
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
import { buildInactiveAlert, mergeToolbarAlerts } from '@/components/grid/toolbar-alert';
import { centralUsersService } from '@/services/central-users.service';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { FormToolbar } from '@/components/grid/form-toolbar';
import { PageBody } from '@/components/common/page-body';
import { FormFieldGrid, FormFieldGridItem } from '@/components/grid/form-field-grid';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';
import { FormPanel } from '@/components/grid/form-panel';
import { FormRecordIdField } from '@/components/grid/form-record-identifier';
import { FormSwitchControl } from '@/components/grid/form-switch-control';
import { GridBadge } from '@/components/grid/grid-badge';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Informe um e-mail válido.'),
  is_active: z.boolean(),
  password: z.string().optional(),
  password_confirmation: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.password || values.password_confirmation) {
    if ((values.password?.length ?? 0) < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A senha deve ter pelo menos 8 caracteres.',
        path: ['password'],
      });
    }

    if (values.password !== values.password_confirmation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'As senhas não conferem.',
        path: ['password_confirmation'],
      });
    }
  }
});

type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  name: '',
  email: '',
  is_active: true,
  password: '',
  password_confirmation: '',
};

export function CentralUserFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUserId = useCentralAuthStore((state) => state.centralUser?.id);
  const apiNotify = useApiToolbarAlert();
  const isEditingSelf = Number(id) === currentUserId;

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['central-user', id],
    queryFn: () => centralUsersService.show(Number(id)),
    enabled: Boolean(id),
  });

  const user = data?.data.result;
  const isActive = user?.is_active ?? true;

  const formPage = useFormPage({
    backPath: '/admin/super-admins',
    entityKey: 'user',
    notify: apiNotify,
    onToggleActive: user && !isEditingSelf
      ? async (active) => {
          await centralUsersService.toggleActive(Number(id), active);
          queryClient.invalidateQueries({ queryKey: ['central-users'] });
          queryClient.invalidateQueries({ queryKey: ['central-user', id] });
        }
      : undefined,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useLayoutEffect(() => {
    form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
  }, [form, location.key]);

  useEffect(() => {
    if (!user) return;

    form.reset(
      {
        name: user.name,
        email: user.email,
        is_active: user.is_active,
        password: '',
        password_confirmation: '',
      },
      { keepDirty: false, keepErrors: false },
    );
  }, [user, form]);

  const saveMutation = useMutation({
    mutationFn: (values: FormData) => {
      const payload = {
        name: values.name,
        email: values.email,
        is_active: values.is_active,
        ...(values.password
          ? {
              password: values.password,
              password_confirmation: values.password_confirmation,
            }
          : {}),
      };

      return centralUsersService.update(Number(id), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['central-users'] });
      queryClient.invalidateQueries({ queryKey: ['central-user', id] });
      apiNotify.showSuccess('Super-admin atualizado com sucesso!');

      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/admin/super-admins',
        getEditPath: () => `/admin/super-admins/${id}`,
        isEditing: true,
      });

      if (nextPath) navigate(nextPath);
    },
    onError: (error: unknown) => {
      const handled = applyApiFormErrors(form, error);
      if (!handled) {
        apiNotify.showError('Erro ao atualizar super-admin.', error);
      }
    },
  });

  const handleSaveAndList = useCallback(() => {
    formPage.setSaveMode('list');
    void form.handleSubmit((values) => saveMutation.mutate(values))();
  }, [form, formPage, saveMutation]);

  const handleSaveAndEdit = useCallback(() => {
    formPage.setSaveMode('edit');
    void form.handleSubmit((values) => saveMutation.mutate(values))();
  }, [form, formPage, saveMutation]);

  useFormKeyboard({
    enabled: !isLoading,
    onSave: handleSaveAndList,
    isSubmitting: saveMutation.isPending,
  });

  const formAlert = useFormToolbarAlert(form);

  const pageAlert = useMemo(
    () => mergeToolbarAlerts(
      formAlert,
      !isActive ? buildInactiveAlert('user') : null,
    ),
    [formAlert, isActive],
  );

  const formRefresh = useFormRefresh({
    isEditing: true,
    isDirty: form.formState.isDirty,
    isFetching,
    refetch: () => refetch(),
    onReset: user
      ? () => form.reset({
          name: user.name,
          email: user.email,
          is_active: user.is_active,
          password: '',
          password_confirmation: '',
        }, { keepDirty: false, keepErrors: false })
      : undefined,
  });

  const pageTitle = formatFormPageTitle({
    isEditing: true,
    id,
    label: user?.name,
    loading: isLoading,
  });

  usePageToolbar({
    title: pageTitle,
    description: 'Edite os dados do usuário com acesso ao painel central.',
    alert: pageAlert,
    actions: (
      <FormToolbar
        isEditing
        isActive={isActive}
        isDirty={form.formState.isDirty}
        isSubmitting={saveMutation.isPending}
        isTogglingActive={formPage.isTogglingActive}
        onSaveAndList={handleSaveAndList}
        onSaveAndEdit={handleSaveAndEdit}
        onBack={formPage.handleBack}
        onToggleActive={user && !isEditingSelf
          ? () => formPage.handleToggleActive(isActive)
          : undefined
        }
        onClear={user
          ? () => form.reset({
              name: user.name,
              email: user.email,
              is_active: user.is_active,
              password: '',
              password_confirmation: '',
            }, { keepDirty: false, keepErrors: false })
          : undefined}
        onRefresh={formRefresh.onRefresh}
        isRefreshing={formRefresh.isRefreshing}
        entityLabel="super-admin"
        recordLabel={user?.name ?? undefined}
      />
    ),
  });

  if (isLoading) {
    return (
      <PageBody>
        <FormPageSkeleton />
      </PageBody>
    );
  }

  return (
    <PageBody>
      <FormPanel title="Dados do super-admin" isActive={isActive}>
        <Form {...form}>
          <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
            <FormRecordIdField id={id} />

            <div className="flex flex-wrap items-center gap-2">
              <GridBadge tone={user?.is_super_admin ? 'primary' : 'muted'}>
                {user?.is_super_admin ? 'Super-admin' : 'Usuário central'}
              </GridBadge>
              <GridBadge tone={user?.is_active ? 'success' : 'destructive'}>
                {user?.is_active ? 'Ativo' : 'Inativo'}
              </GridBadge>
            </div>

            <FormFieldGrid>
              <FormFieldGridItem md={6}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} autoComplete="name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>

              <FormFieldGridItem md={6}>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" autoComplete="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>

              <FormFieldGridItem md={6}>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova senha</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoComplete="new-password" />
                      </FormControl>
                      <FormDescription>Deixe em branco para manter a senha atual.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>

              <FormFieldGridItem md={6}>
                <FormField
                  control={form.control}
                  name="password_confirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar nova senha</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" autoComplete="new-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>

              <FormFieldGridItem>
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário ativo</FormLabel>
                      <FormDescription>
                        {isEditingSelf
                          ? 'Você não pode desativar seu próprio usuário.'
                          : 'Usuários inativos não conseguem acessar o painel central.'}
                      </FormDescription>
                      <FormControl>
                        <FormSwitchControl
                          checked={field.value}
                          disabled={isEditingSelf}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>
            </FormFieldGrid>
          </form>
        </Form>
      </FormPanel>
    </PageBody>
  );
}
