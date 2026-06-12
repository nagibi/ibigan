import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { HtmlEditor } from '@/components/editor/html-editor';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { isHtmlContentEmpty } from '@/lib/is-html-content-empty';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import { messageTemplatesService } from '@/services/message-templates.service';
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

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  slug: z.string().min(1, 'Slug é obrigatório.'),
  subject: z.string().min(1, 'Assunto é obrigatório.'),
  body: z.string().refine((value) => !isHtmlContentEmpty(value), 'Corpo é obrigatório.'),
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
  const isEditing = Boolean(id);
  const [tagInput, setTagInput] = useState('');

  const { data: templateData, isLoading } = useQuery({
    queryKey: ['message-template', id],
    queryFn: () => messageTemplatesService.show(Number(id)),
    enabled: isEditing,
  });

  const template = templateData?.data.result;
  const isActive = template?.is_active ?? true;

  const apiNotify = useApiToolbarAlert();

  const formPage = useFormPage({
    backPath: '/message-templates',
    newPath: '/message-templates/new',
    entityLabel: 'template',
    notify: apiNotify,
    onDelete: isEditing
      ? async () => {
          await messageTemplatesService.destroy(Number(id));
          queryClient.invalidateQueries({ queryKey: ['message-templates'] });
        }
      : undefined,
    onToggleActive: isEditing
      ? async (active) => {
          await messageTemplatesService.toggleActive(Number(id), active);
          queryClient.invalidateQueries({ queryKey: ['message-template', id] });
          queryClient.invalidateQueries({ queryKey: ['message-templates'] });
        }
      : undefined,
    onDuplicate: isEditing
      ? async () => {
          const res = await messageTemplatesService.duplicate(Number(id));
          navigate(`/message-templates/${res.data.result.id}`);
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
    }
  }, [template, form]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      isEditing
        ? messageTemplatesService.update(Number(id), data)
        : messageTemplatesService.store({
            ...data,
            is_active: true,
          } as Parameters<typeof messageTemplatesService.store>[0]),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['message-templates'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['message-template', id] });
      }
      apiNotify.showSuccess(isEditing ? 'Template atualizado!' : 'Template criado!');
      if (!isEditing && formPage.saveMode === 'new') {
        form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
      }
      const createdId = !isEditing ? response.data.result.id : undefined;
      const nextPath = resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/message-templates',
        newPath: '/message-templates/new',
        getEditPath: (recordId) => `/message-templates/${recordId}`,
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
    enabled: !isEditing || !isLoading,
    onSave: handlePrimarySave,
    isSubmitting: saveMutation.isPending,
  });

  const formAlert = useFormToolbarAlert(form);

  const pageAlert = useMemo(
    () => mergeToolbarAlerts(
      formAlert,
      isEditing && !isActive ? buildInactiveAlert('template') : null,
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
      form.setValue('merge_tags', [...current, formatted], { shouldDirty: true });
    }
    setTagInput('');
  }

  const handleImageUpload = useCallback(async (file: File) => {
    try {
      const response = await messageTemplatesService.uploadImage(file);
      return response.data.result.url;
    } catch (error) {
      apiNotify.showError('Erro ao enviar imagem.', error);
      throw error;
    }
  }, [apiNotify]);

  function removeTag(tag: string) {
    const current = form.getValues('merge_tags') ?? [];
    form.setValue(
      'merge_tags',
      current.filter((t) => t !== tag),
      { shouldDirty: true },
    );
  }

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
        onSaveAndList={handleSaveAndList}
        onSaveAndNew={handleSaveAndNew}
        onSaveAndEdit={handleSaveAndEdit}
        onBack={formPage.handleBack}
        onNew={isEditing ? formPage.handleNew : undefined}
        onClear={() => form.reset()}
        onToggleActive={isEditing && template
          ? () => formPage.handleToggleActive(isActive)
          : undefined
        }
        onDelete={isEditing ? formPage.handleDelete : undefined}
        onDuplicate={isEditing ? formPage.handleDuplicate : undefined}
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
            <FormFieldGrid>
              {isEditing && id && (
                <FormFieldGridItem>
                  <FormRecordIdField id={id} />
                </FormFieldGridItem>
              )}
              <FormFieldGridItem>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Nome</FormLabel>
                    <FormControl><Input placeholder="Boas-vindas" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Slug</FormLabel>
                    <FormControl><Input placeholder="boas-vindas" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem span={isEditing ? 1 : 2}>
                <FormField control={form.control} name="subject" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Assunto</FormLabel>
                    <FormControl><Input placeholder="Bem-vindo, {{nome}}!" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
            </FormFieldGrid>
          </FormPanel>

          <FormPanel title="Corpo da mensagem">
            <FormFieldGrid>
              <FormFieldGridItem span={4}>
                <FormField control={form.control} name="body" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Conteúdo</FormLabel>
                    <HtmlEditor
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Olá {{nome}}, bem-vindo à {{empresa}}!"
                      onImageUpload={handleImageUpload}
                    />
                    <FormDescription>
                      Editor HTML com suporte a imagens. Use {'{{variavel}}'} para merge tags.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem span={4}>
                <div className="space-y-2">
                  <FormLabel>Merge Tags</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="nome ou {{nome}}"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[32px]">
                    {(form.watch('merge_tags') ?? []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="font-mono gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)}>
                          <X className="size-3" />
                        </button>
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
