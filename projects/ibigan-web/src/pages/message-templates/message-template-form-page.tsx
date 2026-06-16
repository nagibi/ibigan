import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { isComplexEmailHtml } from '@/lib/is-complex-email-html';
import { isHtmlContentEmpty } from '@/lib/is-html-content-empty';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { useFormKeyboard } from '@/hooks/use-form-keyboard';
import { useFormPage } from '@/hooks/use-form-page';
import { useFormRefresh } from '@/hooks/use-form-refresh';
import { useFormToolbarAlert } from '@/hooks/use-form-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { usePlatformCatalogMode } from '@/hooks/use-platform-catalog-mode';
import { messageTemplatesService } from '@/services/message-templates.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { MessageTemplateBodyEditor } from '@/components/message-templates/message-template-body-editor';
import { MessageTemplateEmailPreview } from '@/components/message-templates/message-template-email-preview';
import { PlatformCatalogBadge } from '@/components/platform/platform-catalog-badge';

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  slug: z.string().min(1, 'Slug é obrigatório.'),
  subject: z.string().min(1, 'Assunto é obrigatório.'),
  body: z
    .string()
    .refine((value) => !isHtmlContentEmpty(value), 'Corpo é obrigatório.'),
  merge_tags: z.array(z.string()).nullable(),
});

type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  name: '',
  slug: '',
  subject: '',
  body: '',
  merge_tags: [],
};

export function MessageTemplateFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const catalog = usePlatformCatalogMode();
  const { isPlatformCatalog, messageTemplates: catalogPaths } = catalog;
  const templatesService = catalogPaths.service;
  const listPath = catalogPaths.listPath;
  const isEditing = Boolean(id);
  const [tagInput, setTagInput] = useState('');
  const [bodyTab, setBodyTab] = useState<'editor' | 'preview'>('editor');
  const tenantUser = useAuthStore((state) => state.user);
  const centralUser = useCentralAuthStore((state) => state.centralUser);
  const previewUser = useMemo(() => {
    const currentUser = isPlatformCatalog ? centralUser : tenantUser;
    return {
      name: currentUser?.name ?? 'Maria Silva',
      email: currentUser?.email ?? 'maria@exemplo.com',
    };
  }, [centralUser, isPlatformCatalog, tenantUser]);

  const {
    data: templateData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      isPlatformCatalog ? 'platform-message-template' : 'message-template',
      id,
    ],
    queryFn: () => templatesService.show(Number(id)),
    enabled: isEditing,
  });

  const template = templateData?.data.result;
  const isActive = template?.is_active ?? true;
  const isReadOnly = !isPlatformCatalog && Boolean(template?.is_system);

  const apiNotify = useApiToolbarAlert();

  const formPage = useFormPage({
    backPath: listPath,
    newPath: `${listPath}/new`,
    entityKey: 'message_template',
    notify: apiNotify,
    onDelete:
      isEditing && !isPlatformCatalog
        ? async () => {
            if (!('destroy' in templatesService)) return;
            await templatesService.destroy(Number(id));
            queryClient.invalidateQueries({ queryKey: ['message-templates'] });
          }
        : undefined,
    onToggleActive: isEditing
      ? async (active) => {
          await templatesService.toggleActive(Number(id), active);
          queryClient.invalidateQueries({
            queryKey: [
              isPlatformCatalog
                ? 'platform-message-template'
                : 'message-template',
              id,
            ],
          });
          queryClient.invalidateQueries({ queryKey: ['message-templates'] });
        }
      : undefined,
    onDuplicate:
      isEditing && 'duplicate' in templatesService
        ? async () => {
            const res = await templatesService.duplicate(Number(id));
            navigate(catalogPaths.getEditPath(res.data.result.id));
          }
        : undefined,
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
    if (template) {
      form.reset(
        {
          name: template.name,
          slug: template.slug,
          subject: template.subject,
          body: template.body,
          merge_tags: template.merge_tags ?? [],
        },
        { keepDirty: false, keepErrors: false },
      );

      if (isComplexEmailHtml(template.body)) {
        setBodyTab('preview');
      }
    }
  }, [template, form]);

  const watchedSubject = form.watch('subject');
  const watchedBody = form.watch('body');
  const watchedMergeTags = form.watch('merge_tags');

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      if (!isEditing) {
        if (!('store' in templatesService)) {
          return Promise.reject(new Error('create-unavailable'));
        }
        return templatesService.store({
          ...data,
          is_active: true,
        } as Parameters<typeof messageTemplatesService.store>[0]);
      }

      return templatesService.update(Number(id), data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      if (isEditing) {
        queryClient.invalidateQueries({
          queryKey: [
            isPlatformCatalog
              ? 'platform-message-template'
              : 'message-template',
            id,
          ],
        });
      }
      apiNotify.showSuccess(
        isPlatformCatalog
          ? 'Template de plataforma atualizado e sincronizado nos tenants.'
          : isEditing
            ? 'Template atualizado!'
            : 'Template criado!',
      );
      if (!isEditing && formPage.saveMode === 'new') {
        form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
      }
      const createdId = !isEditing ? response.data.result.id : undefined;
      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath,
        newPath: `${listPath}/new`,
        getEditPath: catalogPaths.getEditPath,
        isEditing,
        createdId,
      });
      if (nextPath) navigate(nextPath);
    },
    onError: (error: unknown) => {
      const handled = applyApiFormErrors(form, error);
      if (!handled) {
        apiNotify.showError(
          isEditing ? 'Erro ao atualizar template.' : 'Erro ao criar template.',
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

  const handlePrimarySave = handleSaveAndList;

  useFormKeyboard({
    enabled: (!isEditing || !isLoading) && !isReadOnly,
    onSave: handlePrimarySave,
    isSubmitting: saveMutation.isPending,
  });

  const formAlert = useFormToolbarAlert(form);

  const formRefresh = useFormRefresh({
    isEditing,
    isDirty: form.formState.isDirty,
    isFetching: isEditing && isFetching,
    refetch: isEditing ? () => refetch() : undefined,
    onReset: !isEditing
      ? () =>
          form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false })
      : undefined,
  });

  const pageAlert = useMemo(
    () =>
      mergeToolbarAlerts(
        formAlert,
        isEditing && !isActive ? buildInactiveAlert('message_template') : null,
      ),
    [formAlert, isActive, isEditing],
  );

  const pageTitle = formatFormPageTitle({
    isEditing,
    id,
    label: template?.name,
    loading: isEditing && isLoading,
  });

  function addTag() {
    const tag = tagInput.trim();
    if (!tag) return;
    const formatted = tag.startsWith('{{') ? tag : `{{${tag}}}`;
    const current = form.getValues('merge_tags') ?? [];
    if (!current.includes(formatted)) {
      form.setValue('merge_tags', [...current, formatted], {
        shouldDirty: true,
      });
    }
    setTagInput('');
  }

  const handleImageUpload = useCallback(
    async (file: File) => {
      try {
        const response = await messageTemplatesService.uploadImage(file);
        return response.data.result.url;
      } catch (error) {
        apiNotify.showError('Erro ao enviar imagem.', error);
        throw error;
      }
    },
    [apiNotify],
  );

  function removeTag(tag: string) {
    const current = form.getValues('merge_tags') ?? [];
    form.setValue(
      'merge_tags',
      current.filter((t) => t !== tag),
      { shouldDirty: true },
    );
  }

  const slugDisabled =
    isEditing && Boolean(template?.is_system || isPlatformCatalog);

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
        isDuplicating={formPage.isDuplicating}
        onSaveAndList={isReadOnly ? undefined : handleSaveAndList}
        onSaveAndNew={isReadOnly ? undefined : handleSaveAndNew}
        onSaveAndEdit={isReadOnly ? undefined : handleSaveAndEdit}
        onBack={formPage.handleBack}
        onNew={isEditing && !isReadOnly ? formPage.handleNew : undefined}
        onClear={isReadOnly ? undefined : () => form.reset()}
        onRefresh={formRefresh.onRefresh}
        isRefreshing={formRefresh.isRefreshing}
        onToggleActive={
          isEditing && template
            ? () => formPage.handleToggleActive(isActive)
            : undefined
        }
        onDelete={
          isEditing && template && !template.is_system && !isPlatformCatalog
            ? formPage.handleDelete
            : undefined
        }
        onDuplicate={
          isEditing && 'duplicate' in templatesService
            ? formPage.handleDuplicate
            : undefined
        }
        entityLabel="template"
        recordLabel={template?.name}
      />
    ),
  });

  if (isEditing && isLoading) {
    return (
      <FormPageSkeleton
        panels={[
          { titleWidth: 'w-40', fields: 3, showBadge: true },
          { titleWidth: 'w-44', fields: 1, showBadge: false },
        ]}
      />
    );
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
          <FormPanel
            title="Informações básicas"
            isActive={isEditing ? isActive : undefined}
          >
            {template?.is_system || isPlatformCatalog ? (
              <div className="mb-4 space-y-2">
                <PlatformCatalogBadge />
                {isReadOnly ? (
                  <p className="text-sm text-muted-foreground">
                    Este template é gerenciado pela plataforma. Duplique para
                    personalizar.
                  </p>
                ) : null}
              </div>
            ) : null}
            <FormFieldGrid>
              {isEditing && id && (
                <FormFieldGridItem>
                  <FormRecordIdField id={id} />
                </FormFieldGridItem>
              )}
              <FormFieldGridItem>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Nome</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Boas-vindas"
                          disabled={isReadOnly}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Slug</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="boas-vindas"
                          disabled={slugDisabled}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>
              <FormFieldGridItem span={isEditing ? 1 : 2}>
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Assunto</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Bem-vindo, {{nome}}!"
                          disabled={isReadOnly}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>
            </FormFieldGrid>
          </FormPanel>

          <FormPanel title="Corpo da mensagem">
            <FormFieldGrid>
              <FormFieldGridItem span={4}>
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Conteúdo</FormLabel>
                      <Tabs
                        value={bodyTab}
                        onValueChange={(value) =>
                          setBodyTab(value as 'editor' | 'preview')
                        }
                      >
                        <TabsList
                          variant="line"
                          className="mb-3 w-full justify-start"
                        >
                          <TabsTrigger value="editor">Editor</TabsTrigger>
                          <TabsTrigger value="preview">
                            Pré-visualização
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent
                          value="editor"
                          className="mt-0"
                          forceMount
                          hidden={bodyTab !== 'editor'}
                        >
                          <MessageTemplateBodyEditor
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            placeholder="Olá {{nome}}, bem-vindo à {{empresa}}!"
                            onImageUpload={
                              isReadOnly ? undefined : handleImageUpload
                            }
                            disabled={isReadOnly}
                            isSystemTemplate={Boolean(
                              template?.is_system || isPlatformCatalog,
                            )}
                          />
                        </TabsContent>
                        <TabsContent
                          value="preview"
                          className="mt-0"
                          forceMount
                          hidden={bodyTab !== 'preview'}
                        >
                          <MessageTemplateEmailPreview
                            subject={watchedSubject}
                            body={watchedBody}
                            mergeTags={watchedMergeTags}
                            user={previewUser}
                          />
                        </TabsContent>
                      </Tabs>
                      <FormDescription>
                        Templates de e-mail com layout completo devem ser
                        editados em Código HTML. Use Pré-visualização para ver
                        cores, botões e layout finais.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </FormFieldGridItem>
              <FormFieldGridItem span={4}>
                <div className="space-y-2">
                  <FormLabel>Merge Tags</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="nome ou {{nome}}"
                      value={tagInput}
                      disabled={isReadOnly}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      disabled={isReadOnly}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[32px]">
                    {(form.watch('merge_tags') ?? []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="font-mono gap-1"
                      >
                        {tag}
                        {!isReadOnly ? (
                          <button type="button" onClick={() => removeTag(tag)}>
                            <X className="size-3" />
                          </button>
                        ) : null}
                      </Badge>
                    ))}
                  </div>
                </div>
              </FormFieldGridItem>
            </FormFieldGrid>
          </FormPanel>
        </form>
      </Form>
    </PageBody>
  );
}
