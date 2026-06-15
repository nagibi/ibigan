import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { focusFirstFormError } from '@/lib/focus-first-form-error';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useFormKeyboard } from '@/hooks/use-form-keyboard';
import { useFormPage } from '@/hooks/use-form-page';
import { useFormRefresh } from '@/hooks/use-form-refresh';
import { useFormToolbarAlert } from '@/hooks/use-form-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useTranslationAdminContext } from '@/hooks/use-translation-admin-context';
import { PageBody } from '@/components/common/page-body';
import { FormFieldGrid, FormFieldGridItem } from '@/components/grid/form-field-grid';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';
import { FormPanel } from '@/components/grid/form-panel';
import { FormRecordIdField } from '@/components/grid/form-record-identifier';
import { FormToolbar } from '@/components/grid/form-toolbar';
import {
  Form,
  FormControl,
  FormDescription,
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
import { useLanguage } from '@/providers/i18n-provider';

const schema = (t: (key: string) => string) => z.object({
  key: z.string().trim().min(1, t('settings.translations.form.validation.key_required')),
  locale: z.enum(['pt', 'en']),
  value: z.string().trim().min(1, t('settings.translations.form.validation.value_required')),
  is_active: z.boolean(),
});

type FormData = z.infer<ReturnType<typeof schema>>;

const DEFAULT_VALUES: FormData = {
  key: '',
  locale: 'pt',
  value: '',
  is_active: true,
};

export function TranslationFormPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string; tenantId?: string }>();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { reloadTranslations } = useLanguage();
  const translationContext = useTranslationAdminContext();
  const {
    listPath,
    newPath,
    getEditPath,
    translationsApi,
    canManage,
    tenantId,
  } = translationContext;
  const isEditing = Boolean(id);
  const prefilledKey = searchParams.get('key') ?? '';
  const prefilledLocale = searchParams.get('locale') === 'en' ? 'en' : 'pt';
  const lockIdentityFields = Boolean(prefilledKey) || isEditing;

  const { data: translationData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['translation', tenantId, id],
    queryFn: async () => {
      if (!('manage' in translationsApi)) {
        throw new Error(t('settings.translations.form.not_found'));
      }

      const response = await translationsApi.manage({});
      const translation = response.data.result.find((item) => item.id === Number(id));
      if (!translation) {
        throw new Error(t('settings.translations.form.not_found'));
      }
      return translation;
    },
    enabled: isEditing && canManage,
  });

  const translation = translationData;
  const apiNotify = useApiToolbarAlert();
  const formSchema = useMemo(() => schema(t), [t]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const formPage = useFormPage({
    backPath: listPath,
    newPath,
    entityLabel: t('settings.translations.entity'),
  });

  useLayoutEffect(() => {
    if (!isEditing) {
      form.reset({
        ...DEFAULT_VALUES,
        key: prefilledKey,
        locale: prefilledLocale,
      }, { keepDirty: false, keepErrors: false });
    }
  }, [form, isEditing, location.key, prefilledKey, prefilledLocale]);

  useEffect(() => {
    if (translation) {
      form.reset({
        key: translation.key,
        locale: translation.locale as FormData['locale'],
        value: translation.value,
        is_active: translation.is_active,
      }, { keepDirty: false, keepErrors: false });
    }
  }, [form, translation]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!('store' in translationsApi) || !('update' in translationsApi)) {
        return Promise.reject(new Error('unavailable'));
      }

      return isEditing
        ? translationsApi.update(Number(id), data)
        : translationsApi.store(data);
    },
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: ['translations-manage', tenantId] });
      await queryClient.invalidateQueries({ queryKey: ['translation', tenantId, id] });
      await reloadTranslations();
      apiNotify.showSuccess(
        isEditing
          ? t('settings.translations.form.updated')
          : t('settings.translations.form.created'),
      );

      if (!isEditing && formPage.saveMode === 'new') {
        form.reset({
          ...DEFAULT_VALUES,
          locale: prefilledLocale,
        }, { keepDirty: false, keepErrors: false });
      }

      const createdId = !isEditing ? response.data.result.id : undefined;
      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath,
        newPath,
        getEditPath,
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
          ? t('settings.translations.form.error_update')
          : t('settings.translations.form.error_create'),
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
    () => form.reset({
      ...DEFAULT_VALUES,
      key: prefilledKey,
      locale: prefilledLocale,
    }, {
      keepDirty: false,
      keepErrors: false,
      keepTouched: false,
    }),
    [form, prefilledKey, prefilledLocale],
  );

  const handleDiscard = useCallback(() => {
    if (isEditing && translation) {
      form.reset({
        key: translation.key,
        locale: translation.locale as FormData['locale'],
        value: translation.value,
        is_active: translation.is_active,
      }, { keepDirty: false, keepErrors: false, keepTouched: false });
      return;
    }
    resetCreateForm();
  }, [form, isEditing, resetCreateForm, translation]);

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
    label: translation?.key,
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
        onSaveAndList={handleSaveAndList}
        onSaveAndNew={handleSaveAndNew}
        onSaveAndEdit={handleSaveAndEdit}
        onBack={formPage.handleBack}
        onNew={isEditing ? formPage.handleNew : undefined}
        onClear={handleDiscard}
        onRefresh={formRefresh.onRefresh}
        isRefreshing={formRefresh.isRefreshing}
        entityLabel={t('settings.translations.entity')}
        recordLabel={translation?.key}
      />
    ) : undefined,
    breadcrumbs: [
      { title: 'Plataforma' },
      { title: t('menu.translations'), path: '/admin/translations' },
      ...(tenantId ? [{ title: t('settings.translations.title'), path: listPath }] : []),
      { title: pageTitle },
    ],
  });

  if (!canManage) {
    return (
      <PageBody>
        <FormPanel title={t('form.restricted_access')}>
          <p className="text-sm text-muted-foreground">
            {t('settings.translations.form.no_permission')}
          </p>
        </FormPanel>
      </PageBody>
    );
  }

  if (isEditing && isLoading) {
    return <FormPageSkeleton panels={[{ titleWidth: 'w-48', fields: 3 }]} />;
  }

  const localDefault = form.watch('key')
    ? t(form.watch('key'), { defaultValue: '—' })
    : '—';

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
          <FormPanel title={t('settings.translations.form.identification')}>
            <FormFieldGrid>
              {isEditing && id && (
                <FormFieldGridItem>
                  <FormRecordIdField id={id} />
                </FormFieldGridItem>
              )}
              <FormFieldGridItem span={isEditing ? 1 : 2}>
                <FormField control={form.control} name="key" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t('settings.translations.key_label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('settings.translations.key_placeholder')}
                        readOnly={lockIdentityFields}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem span={isEditing ? 1 : 2}>
                <FormField control={form.control} name="locale" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t('settings.translations.column_locale')}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={lockIdentityFields}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pt">pt</SelectItem>
                        <SelectItem value="en">en</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem span={4}>
                <FormField control={form.control} name="value" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t('settings.translations.value_label')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('settings.translations.value_placeholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('settings.translations.local_default', { value: localDefault })}
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
