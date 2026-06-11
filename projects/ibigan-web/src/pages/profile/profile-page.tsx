import { useCallback, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFormState } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useNotificationPreferencesSheet } from '@/providers/notification-preferences-sheet-provider';
import { Bell, Building2, Camera, ChevronRight, LoaderCircle, Trash2 } from 'lucide-react';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import {
  mapUserProfileToFormValues,
  normalizeUserProfilePayload,
  userProfileSchema,
  type UserProfileFormData,
} from '@/lib/user-profile-fields';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useApiMenuByPath } from '@/hooks/use-api-menu-by-path';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useFormKeyboard } from '@/hooks/use-form-keyboard';
import {
  buildUnsavedChangesAlert,
  hasNestedFlagFields,
  useFormToolbarAlert,
} from '@/hooks/use-form-toolbar-alert';
import { focusFirstFormError, validateFormWithFocus } from '@/lib/focus-first-form-error';
import { authService } from '@/services/auth.service';
import { profileService } from '@/services/profile.service';
import { useTenantSwitch } from '@/hooks/use-tenant-switch';
import { useAuthStore } from '@/stores/auth.store';
import { getInitials } from '@/lib/helpers';
import { resolveMenuIcon } from '@/lib/menu-icons';
import { cn } from '@/lib/utils';
import { SecurityContent } from '@/components/security/security-content';
import { UserProfileFields } from '@/components/profile/user-profile-fields';
import { PageBody } from '@/components/common/page-body';
import { FormToolbar } from '@/components/grid/form-toolbar';
import { FormFieldGrid } from '@/components/grid/form-field-grid';
import { FormPanel } from '@/components/grid/form-panel';
import {
  AppearanceSettingsPanel,
  useAppearanceSettings,
} from '@/components/settings/appearance-settings-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';

const USER_PROFILE_FALLBACK = {
  name: '',
  email: '',
  cpf: '',
  phone: '',
  birth_date: '',
  gender: '' as const,
  bio: '',
};

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Senha atual é obrigatória.'),
  password: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres.'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'As senhas não coincidem.',
  path: ['password_confirmation'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { open: openPreferences } = useNotificationPreferencesSheet();
  const profileMenu = useApiMenuByPath('/profile');
  const notificationsMenu = useApiMenuByPath('/notifications');
  const notificationPreferencesMenu = useApiMenuByPath('/notification-preferences');
  const { user, setAuth, tenantId, token } = useAuthStore();
  const { switchToTenant, switchingId } = useTenantSwitch();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const appearance = useAppearanceSettings();
  const apiNotify = useApiToolbarAlert();

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.show(),
  });

  const { data: tenantsData, isLoading: isLoadingTenants } = useQuery({
    queryKey: ['user-tenants'],
    queryFn: () => authService.listTenants(),
    staleTime: 5 * 60 * 1000,
  });

  const profile = data?.data.result;
  const tenants = tenantsData?.data.result ?? [];

  const NotificationsIcon = notificationsMenu
    ? resolveMenuIcon({
      icon: notificationsMenu.icon,
      path: notificationsMenu.path,
      slug: notificationsMenu.slug,
      title: notificationsMenu.title,
    })
    : Bell;

  const NotificationPreferencesIcon = notificationPreferencesMenu
    ? resolveMenuIcon({
      icon: notificationPreferencesMenu.icon,
      path: notificationPreferencesMenu.path,
      slug: notificationPreferencesMenu.slug,
      title: notificationPreferencesMenu.title,
    })
    : Bell;

  const profileForm = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    values: profile ? mapUserProfileToFormValues(profile) : USER_PROFILE_FALLBACK,
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '', password: '', password_confirmation: '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UserProfileFormData) =>
      profileService.update(normalizeUserProfilePayload(data)),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (token && tenantId && user) {
        setAuth(token, tenantId, {
          ...user,
          name: res.data.result.name,
          email: res.data.result.email,
        });
      }
      profileForm.reset(mapUserProfileToFormValues(res.data.result), {
        keepDirty: false,
        keepErrors: false,
        keepTouched: false,
      });
      apiNotify.showSuccess('Perfil atualizado!');
    },
    onError: (error: unknown) => {
      const handled = applyApiFormErrors(profileForm, error);
      if (handled) {
        focusFirstFormError(profileForm);
        return;
      }
      apiNotify.showError('Erro ao atualizar perfil.', error);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormData) => profileService.updatePassword(data),
    onSuccess: () => {
      passwordForm.reset();
      apiNotify.showSuccess('Senha alterada!');
    },
    onError: (error: unknown) => {
      const handled = applyApiFormErrors(passwordForm, error);
      if (handled) {
        focusFirstFormError(passwordForm);
        return;
      }
      apiNotify.showError('Senha atual incorreta.', error);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarPreview(null);
      apiNotify.showSuccess('Avatar atualizado!');
    },
    onError: (error: unknown) => {
      apiNotify.showError('Erro ao enviar avatar.', error);
    },
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: () => profileService.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarPreview(null);
      apiNotify.showSuccess('Avatar removido!');
    },
    onError: (error: unknown) => {
      apiNotify.showError('Erro ao remover avatar.', error);
    },
  });

  const { dirtyFields: profileDirtyFields, touchedFields: profileTouchedFields } = useFormState({
    control: profileForm.control,
  });
  const { dirtyFields: passwordDirtyFields, touchedFields: passwordTouchedFields } = useFormState({
    control: passwordForm.control,
  });

  const profileHasUnsavedChanges =
    hasNestedFlagFields(profileDirtyFields) && hasNestedFlagFields(profileTouchedFields);
  const passwordHasUnsavedChanges =
    hasNestedFlagFields(passwordDirtyFields) && hasNestedFlagFields(passwordTouchedFields);

  const resetProfilePhantomDirty = useCallback(() => {
    if (!profile) return;

    profileForm.reset(mapUserProfileToFormValues(profile), {
      keepDirty: false,
      keepErrors: false,
      keepTouched: false,
    });
  }, [profile, profileForm]);

  const resetPasswordPhantomDirty = useCallback(() => {
    passwordForm.reset(
      { current_password: '', password: '', password_confirmation: '' },
      { keepDirty: false, keepErrors: false, keepTouched: false },
    );
  }, [passwordForm]);

  const handleDiscard = useCallback(() => {
    resetProfilePhantomDirty();
    resetPasswordPhantomDirty();
    appearance.discard();
  }, [appearance, resetPasswordPhantomDirty, resetProfilePhantomDirty]);

  const handleSave = useCallback(async () => {
    const appearanceDirty = appearance.hasChanges;

    if (!profileHasUnsavedChanges && !passwordHasUnsavedChanges && !appearanceDirty) {
      return;
    }

    if (profileHasUnsavedChanges) {
      const profileValid = await validateFormWithFocus(profileForm);
      if (!profileValid) return;
    }

    if (passwordHasUnsavedChanges) {
      const passwordValid = await validateFormWithFocus(passwordForm);
      if (!passwordValid) return;
    }

    if (profileHasUnsavedChanges) {
      await updateMutation.mutateAsync(profileForm.getValues());
    }

    if (passwordHasUnsavedChanges) {
      await passwordMutation.mutateAsync(passwordForm.getValues());
    }

    if (appearanceDirty) {
      await appearance.save();
    }
  }, [
    appearance,
    passwordForm,
    passwordHasUnsavedChanges,
    passwordMutation,
    profileForm,
    profileHasUnsavedChanges,
    updateMutation,
  ]);

  const profileAlert = useFormToolbarAlert(profileForm.control, handleDiscard, {
    resetPhantomDirty: resetProfilePhantomDirty,
  });
  const passwordAlert = useFormToolbarAlert(passwordForm.control, handleDiscard, {
    resetPhantomDirty: resetPasswordPhantomDirty,
  });

  const alert = useMemo(() => {
    if (profileAlert) return profileAlert;
    if (passwordAlert) return passwordAlert;

    if (appearance.hasChanges) {
      return buildUnsavedChangesAlert(handleDiscard, 'appearance-unsaved');
    }

    return null;
  }, [appearance.hasChanges, handleDiscard, passwordAlert, profileAlert]);

  const isDirty =
    profileHasUnsavedChanges
    || passwordHasUnsavedChanges
    || appearance.hasChanges;
  const isSubmitting =
    updateMutation.isPending
    || passwordMutation.isPending
    || appearance.isSaving;

  useFormKeyboard({
    enabled: !isLoading,
    onSave: () => void handleSave(),
    isSubmitting,
  });

  usePageToolbar({
    title: profileMenu?.title ?? 'Meu perfil',
    alert,
    actions: (
      <FormToolbar
        isEditing
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        onSaveAndList={() => void handleSave()}
        entityLabel="perfil"
        recordLabel={profile?.name}
      />
    ),
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    avatarMutation.mutate(file);
  }

  if (isLoading) {
    return (
      <FormPageSkeleton
        panels={[
          { titleWidth: 'w-28', fields: 1 },
          { titleWidth: 'w-32', fields: 6 },
          { titleWidth: 'w-28', fields: 3 },
        ]}
      />
    );
  }

  return (
    <PageBody>
      <FormPanel title="Foto do perfil">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="size-20">
              <AvatarImage src={avatarPreview ?? profile?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                {getInitials(profile?.name ?? '', 2)}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              mode="icon"
              size="sm"
              className="absolute -bottom-1 -right-1 size-7 rounded-full"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarMutation.isPending}
            >
              {avatarMutation.isPending
                ? <LoaderCircle className="size-3 animate-spin" />
                : <Camera className="size-3" />
              }
            </Button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold">{profile?.name}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
            <div className="mt-1 flex gap-1">
              {profile?.roles?.map((role) => (
                <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
              ))}
            </div>
          </div>
          {profile?.avatar_url && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteAvatarMutation.mutate()}
              disabled={deleteAvatarMutation.isPending}
            >
              <Trash2 className="mr-1 size-4" /> Remover foto
            </Button>
          )}
        </div>
      </FormPanel>

      <Form {...profileForm}>
        <form
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <FormPanel title="Dados pessoais">
            <FormFieldGrid>
              <UserProfileFields control={profileForm.control} />
            </FormFieldGrid>
          </FormPanel>
        </form>
      </Form>

      <FormPanel title="Empresas">
        {isLoadingTenants ? (
          <div className="flex justify-center py-6">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : tenants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma empresa vinculada à sua conta.</p>
        ) : (
          <div className="space-y-2">
            {tenants.map((tenant) => {
              const isCurrent = tenant.id === tenantId;

              return (
                <button
                  key={tenant.id}
                  type="button"
                  disabled={isCurrent || switchingId !== null}
                  onClick={() => {
                    if (!isCurrent) {
                      void switchToTenant(tenant.id);
                    }
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                    isCurrent
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border hover:border-primary hover:bg-muted/50',
                    !isCurrent && switchingId !== null && 'cursor-not-allowed opacity-60',
                  )}
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{tenant.name ?? tenant.slug}</p>
                    <p className="truncate text-xs text-muted-foreground">{tenant.slug}</p>
                  </div>
                  {isCurrent ? (
                    <Badge variant="primary" appearance="light" size="sm" className="shrink-0">
                      Atual
                    </Badge>
                  ) : switchingId === tenant.id ? (
                    <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </FormPanel>

      <FormPanel title="Notificações">
        <div className="space-y-2">
          <Link
            to="/notifications"
            className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary hover:bg-muted/50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <NotificationsIcon className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {notificationsMenu?.title ?? 'Minhas notificações'}
              </p>
              <p className="text-xs text-muted-foreground">Ver e gerenciar notificações recebidas.</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
          <button
            type="button"
            onClick={openPreferences}
            className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-primary hover:bg-muted/50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <NotificationPreferencesIcon className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">
                {notificationPreferencesMenu?.title ?? 'Preferências de Notificação'}
              </p>
              <p className="text-xs text-muted-foreground">Configurar canais e tipos de alerta.</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </div>
      </FormPanel>

      <AppearanceSettingsPanel state={appearance} />

      <Form {...passwordForm}>
        <form
          autoComplete="off"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <FormPanel title="Alterar senha">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <FormField control={passwordForm.control} name="current_password" render={({ field }) => (
                <FormItem>
                  <FormLabel required>Senha atual</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Sua senha atual" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel required>Nova senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Mínimo 8 caracteres" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="password_confirmation" render={({ field }) => (
                <FormItem>
                  <FormLabel required>Confirmar nova senha</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Repita a nova senha" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
          </FormPanel>
        </form>
      </Form>

      <SecurityContent />
    </PageBody>
  );
}
