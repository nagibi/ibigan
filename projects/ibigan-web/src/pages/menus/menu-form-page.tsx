import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import { menusService } from '@/services/menus.service';
import { useAuthStore } from '@/stores/auth.store';
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
import { Switch } from '@/components/ui/switch';

const schema = z.object({
  title: z.string().min(1, 'Título é obrigatório.'),
  slug: z.string().min(1, 'Slug é obrigatório.'),
  icon: z.string().optional(),
  badge: z.string().optional(),
  path: z.string().optional(),
  target: z.enum(['_self', '_blank']),
  parent_id: z.number().nullable().optional(),
  order: z.number().int().min(0),
  requires_auth: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  title: '',
  slug: '',
  icon: '',
  badge: '',
  path: '',
  target: '_self',
  parent_id: null,
  order: 0,
  requires_auth: true,
};

export function MenuFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tenantId = useAuthStore((state) => state.tenantId);
  const isEditing = Boolean(id);

  const { data: allMenus } = useQuery({
    queryKey: ['menus', tenantId],
    queryFn: () => menusService.list(),
    enabled: Boolean(tenantId),
  });

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['menu', id],
    queryFn: () => menusService.show(Number(id)),
    enabled: isEditing,
  });

  const menu = menuData?.data.result;
  const isActive = menu?.is_active ?? true;

  const apiNotify = useApiToolbarAlert();

  const formPage = useFormPage({
    backPath: '/menus',
    entityLabel: 'menu',
    notify: apiNotify,
    onDelete: isEditing
      ? async () => {
          await menusService.destroy(Number(id));
          queryClient.invalidateQueries({ queryKey: ['menus'] });
        }
      : undefined,
    onToggleActive: isEditing
      ? async (active) => {
          await menusService.toggleActive(Number(id), active);
          queryClient.invalidateQueries({ queryKey: ['menu', id] });
          queryClient.invalidateQueries({ queryKey: ['menus'] });
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
    if (menu) {
      form.reset(
        {
          title: menu.title,
          slug: menu.slug,
          icon: menu.icon ?? '',
          badge: menu.badge ?? '',
          path: menu.path ?? '',
          target: menu.target as '_self' | '_blank',
          parent_id: menu.parent_id,
          order: menu.order,
          requires_auth: menu.requires_auth,
        },
        { keepDirty: false, keepErrors: false },
      );
    }
  }, [menu, form]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        badge: data.badge?.trim() || null,
      };

      return isEditing
        ? menusService.update(Number(id), payload)
        : menusService.store({
            ...payload,
            is_active: true,
          } as Parameters<typeof menusService.store>[0]);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['menu', id] });
      }
      apiNotify.showSuccess(isEditing ? 'Menu atualizado!' : 'Menu criado!');
      if (!isEditing && formPage.saveMode === 'new') {
        form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
      }
      const createdId = !isEditing ? response.data.result.id : undefined;
      navigate(resolveFormSavePath({
        saveMode: formPage.saveMode,
        listPath: '/menus',
        newPath: '/menus/new',
        getEditPath: (recordId) => `/menus/${recordId}`,
        isEditing,
        createdId,
      }));
    },
    onError: (error: unknown) => {
      const handled = applyApiFormErrors(form, error);
      if (!handled) {
        apiNotify.showError(
          isEditing ? 'Erro ao atualizar menu.' : 'Erro ao criar menu.',
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

  const handleDiscard = useCallback(
    () => form.reset(undefined, { keepDirty: false, keepErrors: false }),
    [form],
  );
  const formAlert = useFormToolbarAlert(form.control, handleDiscard);

  const pageAlert = useMemo(
    () => mergeToolbarAlerts(
      formAlert,
      isEditing && !isActive ? buildInactiveAlert('menu') : null,
    ),
    [formAlert, isActive, isEditing],
  );

  const pageTitle = formatFormPageTitle({
    isEditing,
    id,
    label: menu?.title,
    loading: isEditing && isLoading,
  });

  const parentOptions = allMenus?.data.result
    .filter((m) => !m.parent_id && m.id !== Number(id))
    ?? [];

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
        onToggleActive={isEditing && menu
          ? () => formPage.handleToggleActive(isActive)
          : undefined
        }
        onDelete={isEditing ? formPage.handleDelete : undefined}
        entityLabel="menu"
        recordLabel={menu?.title}
      />
    ),
  });

  if (isEditing && isLoading) {
    return (
      <FormPageSkeleton
        panels={[{ titleWidth: 'w-36', fields: 6, showBadge: true }]}
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
            title="Dados do menu"
            isActive={isEditing ? isActive : undefined}
          >
            <FormFieldGrid>
              {isEditing && id && (
                <FormFieldGridItem>
                  <FormRecordIdField id={id} />
                </FormFieldGridItem>
              )}
              <FormFieldGridItem>
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Título</FormLabel>
                    <FormControl><Input placeholder="Ex: Dashboard" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField control={form.control} name="slug" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Slug</FormLabel>
                    <FormControl><Input placeholder="ex: dashboard" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField control={form.control} name="icon" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone (Lucide)</FormLabel>
                    <FormControl><Input placeholder="Ex: LayoutDashboard" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField control={form.control} name="path" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caminho</FormLabel>
                    <FormControl><Input placeholder="Ex: /dashboard" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem span={2}>
                <FormField control={form.control} name="badge" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Badge (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Novo, Beta, 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField control={form.control} name="target" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="_self">Mesma aba</SelectItem>
                        <SelectItem value="_blank">Nova aba</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField control={form.control} name="order" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ordem</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              {parentOptions.length > 0 && (
                <FormFieldGridItem span={2}>
                  <FormField control={form.control} name="parent_id" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Menu pai (opcional)</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(v === 'none' ? null : Number(v))}
                        value={field.value ? String(field.value) : 'none'}
                      >
                        <FormControl><SelectTrigger><SelectValue placeholder="Nenhum (item raiz)" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum (item raiz)</SelectItem>
                          {parentOptions.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>{m.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </FormFieldGridItem>
              )}
              <FormFieldGridItem>
                <FormField control={form.control} name="requires_auth" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requer autenticação</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
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
