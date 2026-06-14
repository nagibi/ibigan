import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { applyApiFormErrors } from '@/lib/apply-api-form-errors';
import { formatFormPageTitle } from '@/lib/format-form-page-title';
import { resolveFormSavePath } from '@/lib/resolve-form-save-path';
import { reportsService } from '@/services/reports.service';
import { usePlatformCatalogMode } from '@/hooks/use-platform-catalog-mode';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useFormKeyboard } from '@/hooks/use-form-keyboard';
import { useFormPage } from '@/hooks/use-form-page';
import { useFormRefresh } from '@/hooks/use-form-refresh';
import { useFormToolbarAlert } from '@/hooks/use-form-toolbar-alert';
import { buildInactiveAlert, mergeToolbarAlerts } from '@/components/grid/toolbar-alert';
import { FormToolbar } from '@/components/grid/form-toolbar';
import { PageBody } from '@/components/common/page-body';
import { FormFieldGrid, FormFieldGridItem, FormRepeatableRow, FormRepeatableRowAction } from '@/components/grid/form-field-grid';
import { FormPageSkeleton } from '@/components/grid/form-page-skeleton';
import { FormPanel } from '@/components/grid/form-panel';
import { FormRecordIdField } from '@/components/grid/form-record-identifier';
import { PlatformCatalogBadge } from '@/components/platform/platform-catalog-badge';
import { FormSwitchControl } from '@/components/grid/form-switch-control';
import { SqlEditor } from '@/components/editor/sql-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const paramSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['text', 'number', 'date', 'select']),
  label: z.string().min(1),
  required: z.boolean(),
  options: z.string().optional(),
});

const colSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  format: z.enum(['text', 'number', 'datetime', 'date', 'currency', 'boolean']),
});

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório.'),
  description: z.string().optional(),
  query: z.string().min(1, 'Query é obrigatória.'),
  parameters: z.array(paramSchema),
  columns: z.array(colSchema),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const DEFAULT_VALUES: FormData = {
  name: '',
  description: '',
  query: '',
  parameters: [],
  columns: [],
  is_active: true,
};

export function ReportFormPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const catalog = usePlatformCatalogMode();
  const { isPlatformCatalog, reports: catalogPaths } = catalog;
  const reportsApi = catalogPaths.service;
  const listPath = catalogPaths.listPath;
  const isEditing = Boolean(id);

  const { data: reportData, isLoading, isFetching, refetch } = useQuery({
    queryKey: [isPlatformCatalog ? 'platform-report' : 'report', id],
    queryFn: () => reportsApi.show(Number(id)),
    enabled: isEditing,
  });

  const report = reportData?.data.result;
  const isActive = report?.is_active ?? true;
  const isReadOnly = !isPlatformCatalog && Boolean(report?.is_system);

  const apiNotify = useApiToolbarAlert();

  const formPage = useFormPage({
    backPath: listPath,
    newPath: `${listPath}/new`,
    entityKey: 'report',
    notify: apiNotify,
    onDelete: isEditing && !isPlatformCatalog
      ? async () => {
          if (!('destroy' in reportsApi)) return;
          await reportsApi.destroy(Number(id));
          queryClient.invalidateQueries({ queryKey: ['reports'] });
        }
      : undefined,
    onToggleActive: isEditing
      ? async (active) => {
          await reportsApi.toggleActive(Number(id), active);
          queryClient.invalidateQueries({ queryKey: [isPlatformCatalog ? 'platform-report' : 'report', id] });
          queryClient.invalidateQueries({ queryKey: ['reports'] });
        }
      : undefined,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  const { fields: paramFields, append: appendParam, remove: removeParam } = useFieldArray({
    control: form.control,
    name: 'parameters',
  });

  const { fields: colFields, append: appendCol, remove: removeCol } = useFieldArray({
    control: form.control,
    name: 'columns',
  });

  useLayoutEffect(() => {
    if (!isEditing) {
      form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false });
    }
  }, [isEditing, form, location.key]);

  useEffect(() => {
    if (report) {
      form.reset(
        {
          name: report.name,
          description: report.description ?? '',
          query: report.query ?? '',
          parameters: (report.parameters ?? []).map((p) => ({
            ...p,
            options: p.options?.join(',') ?? '',
          })),
          columns: report.columns ?? [],
          is_active: report.is_active,
        },
        { keepDirty: false, keepErrors: false },
      );
    }
  }, [report, form]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        parameters: data.parameters.map((p) => ({
          ...p,
          options: p.options ? p.options.split(',').map((o) => o.trim()) : undefined,
        })),
      };

      if (!isEditing) {
        if (!('store' in reportsApi)) {
          return Promise.reject(new Error('create-unavailable'));
        }
        return reportsApi.store(payload);
      }

      return reportsApi.update(Number(id), payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: [isPlatformCatalog ? 'platform-report' : 'report', id] });
      }
      apiNotify.showSuccess(
        isPlatformCatalog
          ? 'Relatório de plataforma atualizado e sincronizado nos tenants.'
          : (isEditing ? 'Relatório atualizado!' : 'Relatório criado!'),
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
          isEditing ? 'Erro ao atualizar relatório.' : 'Erro ao criar relatório.',
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
      ? () => form.reset(DEFAULT_VALUES, { keepDirty: false, keepErrors: false })
      : undefined,
  });

  const pageAlert = useMemo(
    () => mergeToolbarAlerts(
      formAlert,
      isEditing && !isActive ? buildInactiveAlert('report') : null,
    ),
    [formAlert, isActive, isEditing],
  );

  const pageTitle = formatFormPageTitle({
    isEditing,
    id,
    label: report?.name,
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
        onSaveAndList={isReadOnly ? undefined : handleSaveAndList}
        onSaveAndNew={isReadOnly ? undefined : handleSaveAndNew}
        onSaveAndEdit={isReadOnly ? undefined : handleSaveAndEdit}
        onBack={formPage.handleBack}
        onNew={isEditing && !isReadOnly ? formPage.handleNew : undefined}
        onClear={isReadOnly ? undefined : () => form.reset()}
        onRefresh={formRefresh.onRefresh}
        isRefreshing={formRefresh.isRefreshing}
        onToggleActive={isEditing && report
          ? () => formPage.handleToggleActive(isActive)
          : undefined
        }
        onDelete={isEditing && report && !report.is_system && !isPlatformCatalog ? formPage.handleDelete : undefined}
        entityLabel="relatório"
        recordLabel={report?.name}
      />
    ),
  });

  if (isEditing && isLoading) {
    return (
      <FormPageSkeleton
        panels={[
          { titleWidth: 'w-40', fields: 2, showBadge: true },
          { titleWidth: 'w-32', fields: 1, showBadge: false },
          { titleWidth: 'w-32', fields: 2, showBadge: false },
          { titleWidth: 'w-28', fields: 2, showBadge: false },
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
            {report?.is_system || isPlatformCatalog ? (
              <div className="mb-4 space-y-2">
                <PlatformCatalogBadge />
                {isReadOnly ? (
                  <p className="text-sm text-muted-foreground">
                    Este relatório é gerenciado pela plataforma e só pode ser editado no painel central.
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
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Nome</FormLabel>
                    <FormControl><Input placeholder="Usuários por período" disabled={isReadOnly} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
              <FormFieldGridItem>
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl><Input placeholder="Breve descrição" disabled={isReadOnly} {...field} /></FormControl>
                  </FormItem>
                )} />
              </FormFieldGridItem>
              {!isEditing && (
                <FormFieldGridItem>
                  <FormField control={form.control} name="is_active" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ativo</FormLabel>
                      <FormControl>
                        <FormSwitchControl checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </FormFieldGridItem>
              )}
            </FormFieldGrid>
          </FormPanel>

          <FormPanel title="Query SQL">
            <FormFieldGrid>
              <FormFieldGridItem span={4}>
                <FormField control={form.control} name="query" render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Query</FormLabel>
                    <SqlEditor
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={isReadOnly}
                      placeholder="SELECT id, name, email FROM users WHERE created_at BETWEEN :date_from AND :date_to"
                    />
                    <FormDescription>
                      Use <code className="bg-muted px-1 rounded">:parametro</code> para parâmetros dinâmicos. Apenas SELECT é permitido.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </FormFieldGridItem>
            </FormFieldGrid>
          </FormPanel>

          <FormPanel title="Parâmetros">
            {!isReadOnly ? (
              <div className="mb-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendParam({ name: '', type: 'text', label: '', required: true })}
                >
                  <Plus className="size-4 mr-1" /> Adicionar
                </Button>
              </div>
            ) : null}
            {paramFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem parâmetros — relatório executa sem filtros.</p>
            ) : (
              <div className="space-y-3">
                {paramFields.map((field, i) => (
                  <FormRepeatableRow key={field.id} variant="5-col">
                    <FormField control={form.control} name={`parameters.${i}.name`} render={({ field: f }) => (
                      <FormItem>
                        {i === 0 && <FormLabel className="text-xs">Nome (código)</FormLabel>}
                        <FormControl><Input placeholder="date_from" className="font-mono text-sm" disabled={isReadOnly} {...f} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`parameters.${i}.label`} render={({ field: f }) => (
                      <FormItem>
                        {i === 0 && <FormLabel className="text-xs">Label</FormLabel>}
                        <FormControl><Input placeholder="Data início" disabled={isReadOnly} {...f} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`parameters.${i}.type`} render={({ field: f }) => (
                      <FormItem>
                        {i === 0 && <FormLabel className="text-xs">Tipo</FormLabel>}
                        <Select onValueChange={f.onChange} value={f.value} disabled={isReadOnly}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="select">Seleção</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`parameters.${i}.required`} render={({ field: f }) => (
                      <FormItem>
                        {i === 0 && <FormLabel className="text-xs">Obrigatório</FormLabel>}
                        <FormControl>
                          <FormSwitchControl checked={f.value} onCheckedChange={f.onChange} disabled={isReadOnly} />
                        </FormControl>
                      </FormItem>
                    )} />
                    <FormRepeatableRowAction>
                      {!isReadOnly ? (
                        <Button type="button" variant="ghost" mode="icon" size="sm" onClick={() => removeParam(i)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      ) : null}
                    </FormRepeatableRowAction>
                  </FormRepeatableRow>
                ))}
              </div>
            )}
          </FormPanel>

          <FormPanel title="Colunas">
            {!isReadOnly ? (
              <div className="mb-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendCol({ key: '', label: '', format: 'text' })}
                >
                  <Plus className="size-4 mr-1" /> Adicionar
                </Button>
              </div>
            ) : null}
            {colFields.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem colunas — exibe todos os campos retornados pela query.</p>
            ) : (
              <div className="space-y-3">
                {colFields.map((field, i) => (
                  <FormRepeatableRow key={field.id} variant="4-col">
                    <FormField control={form.control} name={`columns.${i}.key`} render={({ field: f }) => (
                      <FormItem>
                        {i === 0 && <FormLabel className="text-xs">Chave (campo SQL)</FormLabel>}
                        <FormControl><Input placeholder="created_at" className="font-mono text-sm" disabled={isReadOnly} {...f} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`columns.${i}.label`} render={({ field: f }) => (
                      <FormItem>
                        {i === 0 && <FormLabel className="text-xs">Label</FormLabel>}
                        <FormControl><Input placeholder="Criado em" disabled={isReadOnly} {...f} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name={`columns.${i}.format`} render={({ field: f }) => (
                      <FormItem>
                        {i === 0 && <FormLabel className="text-xs">Formato</FormLabel>}
                        <Select onValueChange={f.onChange} value={f.value} disabled={isReadOnly}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="datetime">Data e hora</SelectItem>
                            <SelectItem value="currency">Moeda</SelectItem>
                            <SelectItem value="boolean">Booleano</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormRepeatableRowAction>
                      {!isReadOnly ? (
                        <Button type="button" variant="ghost" mode="icon" size="sm" onClick={() => removeCol(i)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      ) : null}
                    </FormRepeatableRowAction>
                  </FormRepeatableRow>
                ))}
              </div>
            )}
          </FormPanel>
        </form>
      </Form>
    </PageBody>
  );
}
