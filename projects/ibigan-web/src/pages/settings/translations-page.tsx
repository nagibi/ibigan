import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { showApiToast } from '@/lib/show-api-toast';
import { useLanguage } from '@/providers/i18n-provider';
import {
  translationsService,
  type TenantTranslation,
} from '@/services/translations.service';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPanelToolbar } from '@/components/grid/grid-toolbar';
import { GridTable } from '@/components/grid/grid-table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const GRID_COLUMNS_KEY = 'grid-columns:translations';

const emptyForm = {
  key: '',
  locale: 'pt',
  value: '',
  is_active: true,
};

export function TranslationsPage() {
  const { t } = useTranslation();
  const { reloadTranslations } = useLanguage();
  const queryClient = useQueryClient();
  const grid = useGrid();
  const [localeFilter, setLocaleFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TenantTranslation | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data, isLoading, isFetching, refetch, isError, error } = useQuery({
    queryKey: ['translations-manage', localeFilter, grid.debouncedSearch],
    queryFn: () => translationsService.manage({
      locale: localeFilter === 'all' ? undefined : localeFilter,
      search: grid.debouncedSearch || undefined,
    }),
  });

  const translations = data?.data.result ?? [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        return translationsService.update(editing.id, form);
      }

      return translationsService.store(form);
    },
    onSuccess: async (response) => {
      showApiToast(
        response.data,
        editing ? 'translation.updated_successfully' : 'translation.created_successfully',
      );
      await queryClient.invalidateQueries({ queryKey: ['translations-manage'] });
      await reloadTranslations();
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (mutationError) => {
      toast.error(getApiErrorMessage(mutationError));
    },
  });

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((translation: TenantTranslation) => {
    setEditing(translation);
    setForm({
      key: translation.key,
      locale: translation.locale,
      value: translation.value,
      is_active: translation.is_active,
    });
    setDialogOpen(true);
  }, []);

  const columnDefinitions = useMemo<GridColumnDef<TenantTranslation>[]>(
    () => [
      {
        id: 'key',
        label: t('settings.translations.column_key'),
        sortable: true,
        sortKey: 'key',
        render: (row) => row.key,
      },
      {
        id: 'locale',
        label: t('settings.translations.column_locale'),
        sortable: true,
        sortKey: 'locale',
        render: (row) => row.locale,
      },
      {
        id: 'value',
        label: t('settings.translations.column_value'),
        render: (row) => row.value,
      },
      {
        id: 'actions',
        label: '',
        hideable: false,
        className: 'w-[80px]',
        render: (row) => (
          <Button
            type="button"
            variant="ghost"
            mode="icon"
            onClick={() => openEdit(row)}
          >
            <Pencil className="size-4" />
          </Button>
        ),
      },
    ],
    [openEdit, t],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const toolbarActions = useMemo(
    () => (
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => void reloadTranslations()}>
          <RefreshCw className="mr-2 size-4" />
          {t('settings.translations.reload')}
        </Button>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-2 size-4" />
          {t('settings.translations.new_override')}
        </Button>
      </div>
    ),
    [openCreate, reloadTranslations, t],
  );

  usePageToolbar({
    title: t('menu.translations'),
    description: t('settings.translations.description'),
    actions: toolbarActions,
    breadcrumbs: [
      { label: t('menu.settings') },
      { label: t('menu.languages') },
      { label: t('menu.translations') },
    ],
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={(
          <GridPanelToolbar
            onRefresh={() => void refetch()}
            isRefreshing={isLoading || isFetching}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder={t('settings.translations.search_placeholder')}
            filtersControl={(
              <Select value={localeFilter} onValueChange={setLocaleFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t('settings.translations.column_locale')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="pt">pt</SelectItem>
                  <SelectItem value="en">en</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        )}
      >
        <GridTable
          columns={gridColumns.visibleColumns}
          data={translations}
          getRowKey={(row) => String(row.id)}
          loading={isLoading}
          emptyMessage={isError ? getApiErrorMessage(error) : t('grid.empty')}
          onColumnOrderChange={gridColumns.reorderDraggableColumns}
        />
      </GridPanel>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? t('settings.translations.edit_override')
                : t('settings.translations.new_override')}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="translation-key">{t('settings.translations.key_label')}</Label>
              <Input
                id="translation-key"
                value={form.key}
                onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))}
                placeholder={t('settings.translations.key_placeholder')}
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.translations.local_default', {
                  value: t(form.key || 'menu.users', { defaultValue: '—' }),
                })}
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.translations.column_locale')}</Label>
              <Select
                value={form.locale}
                onValueChange={(value) => setForm((current) => ({ ...current, locale: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pt">pt</SelectItem>
                  <SelectItem value="en">en</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="translation-value">{t('settings.translations.value_label')}</Label>
              <Input
                id="translation-value"
                value={form.value}
                onChange={(event) => setForm((current) => ({ ...current, value: event.target.value }))}
                placeholder={t('settings.translations.value_placeholder')}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageBody>
  );
}
