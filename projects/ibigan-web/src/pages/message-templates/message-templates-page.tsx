import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Copy, Pencil, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useApiToolbarAlert } from '@/hooks/use-api-toolbar-alert';
import { TOGGLE_ACTIVE_LABELS } from '@/lib/toggle-active-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridKeyboard } from '@/hooks/use-grid-keyboard';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridFilters } from '@/hooks/use-grid-filters';
import {
  messageTemplatesService,
  type MessageChannel,
  type MessageTemplate,
} from '@/services/message-templates.service';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridFiltersControl } from '@/components/grid/grid-filters-control';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { PageBody } from '@/components/common/page-body';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridPagination, type GridPaginationMeta } from '@/components/grid/grid-pagination';
import { GridTable } from '@/components/grid/grid-table';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridPanelToolbar, StandardGridToolbar } from '@/components/grid/grid-toolbar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { GridBadge } from '@/components/grid/grid-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const GRID_COLUMNS_KEY = 'grid-columns:message-templates';

const CHANNEL_OPTIONS: { value: MessageChannel; label: string }[] = [
  { value: 'email', label: 'E-mail' },
  { value: 'sms', label: 'SMS' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'notification', label: 'Notificação' },
];

const STATUS_FILTER_OPTIONS = [
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
];

function resetSendState() {
  return {
    recipients: [] as string[],
    recipientInput: '',
    channels: ['email'] as MessageChannel[],
  };
}

export function MessageTemplatesPage() {
  const navigate = useNavigate();
  const loadRef = useRef<() => Promise<void>>(async () => {});
  const { showSuccess, showToggleActive, showError } = useApiToolbarAlert();

  const grid = useGrid({
    onActivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => messageTemplatesService.toggleActive(id, true)));
        showToggleActive(true, TOGGLE_ACTIVE_LABELS.template, ids.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao ativar template(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
    onDeactivate: async (ids) => {
      try {
        await Promise.all(ids.map((id) => messageTemplatesService.toggleActive(id, false)));
        showToggleActive(false, TOGGLE_ACTIVE_LABELS.template, ids.length);
        await loadRef.current();
      } catch (error) {
        showError('Erro ao inativar template(s).', error);
        throw new Error('toggle-active-failed');
      }
    },
  });

  const columnFilters = useGridFilters(() => grid.setPage(1));

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [meta, setMeta] = useState<GridPaginationMeta>({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowStatusId, setRowStatusId] = useState<number | null>(null);
  const [sendTemplate, setSendTemplate] = useState<MessageTemplate | null>(null);
  const [sendRecipients, setSendRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState('');
  const [sendChannels, setSendChannels] = useState<MessageChannel[]>(['email']);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await messageTemplatesService.list(
        grid.page,
        grid.perPage,
        grid.debouncedSearch,
        grid.sort,
        grid.sortDir,
        columnFilters.activeFilterParams,
      );
      setTemplates(res.data.result.data);
      setMeta(res.data.result.meta);
    } catch (error) {
      showError('Erro ao carregar templates.', error);
    } finally {
      setLoading(false);
    }
  }, [
    grid.page,
    grid.perPage,
    grid.debouncedSearch,
    grid.sort,
    grid.sortDir,
    columnFilters.activeFilterParams,
    showError,
  ]);

  loadRef.current = load;

  useEffect(() => {
    void load();
  }, [load]);

  const sendMutation = useMutation({
    mutationFn: () =>
      messageTemplatesService.send(sendTemplate!.id, {
        recipients: sendRecipients,
        channels: sendChannels,
      }),
    onSuccess: () => {
      showSuccess('Mensagem enfileirada com sucesso!');
      closeSendDialog();
    },
    onError: (error) => showError('Erro ao enviar mensagem.', error),
  });

  const handleEditSelected = useCallback(() => {
    if (!grid.singleSelection) return;
    navigate(`/message-templates/${grid.selected[0]}`);
  }, [grid.singleSelection, grid.selected, navigate]);

  const handleDeleteSelected = useCallback(() => {
    if (!grid.hasSelection) return;
    grid.requestDelete(grid.selected);
  }, [grid.hasSelection, grid.requestDelete, grid.selected]);

  const handleEscape = useCallback(() => {
    if (sendTemplate !== null) {
      closeSendDialog();
      return;
    }
    if (grid.deleteIds.length > 0) {
      grid.clearDeleteRequest();
    }
    if (grid.hasSelection) {
      grid.clearSelection();
    }
  }, [
    sendTemplate,
    grid.clearDeleteRequest,
    grid.clearSelection,
    grid.deleteIds.length,
    grid.hasSelection,
  ]);

  useGridKeyboard({
    canEdit: grid.singleSelection,
    canDelete: grid.hasSelection,
    onEdit: handleEditSelected,
    onDelete: handleDeleteSelected,
    onEscape: handleEscape,
  });

  async function handleDelete() {
    if (grid.deleteIds.length === 0) return;

    try {
      setIsDeleting(true);
      await Promise.all(grid.deleteIds.map((id) => messageTemplatesService.destroy(id)));
      showSuccess(
        grid.deleteIds.length === 1
          ? 'Template removido.'
          : `${grid.deleteIds.length} templates removidos.`,
      );
      grid.clearDeleteRequest();
      grid.clearSelection();
      void load();
    } catch (error) {
      showError('Erro ao remover template(s).', error);
    } finally {
      setIsDeleting(false);
    }
  }

  const handleEditTemplate = useCallback(
    (templateId: number) => navigate(`/message-templates/${templateId}`),
    [navigate],
  );

  async function handleDuplicate(templateId: number) {
    try {
      setDuplicatingId(templateId);
      const res = await messageTemplatesService.duplicate(templateId);
      showSuccess('Template duplicado com sucesso!');
      navigate(`/message-templates/${res.data.result.id}`);
    } catch (error) {
      showError('Erro ao duplicar template.', error);
    } finally {
      setDuplicatingId(null);
    }
  }

  async function handleRowStatusChange(template: MessageTemplate, active: boolean) {
    if (template.is_active === active) return;

    try {
      setRowStatusId(template.id);
      await messageTemplatesService.toggleActive(template.id, active);
      showToggleActive(active, TOGGLE_ACTIVE_LABELS.template);
      void load();
    } catch (error) {
      showError('Erro ao atualizar status do template.', error);
    } finally {
      setRowStatusId(null);
    }
  }

  function closeSendDialog() {
    setSendTemplate(null);
    const reset = resetSendState();
    setSendRecipients(reset.recipients);
    setRecipientInput(reset.recipientInput);
    setSendChannels(reset.channels);
  }

  function openSendDialog(template: MessageTemplate) {
    const reset = resetSendState();
    setSendTemplate(template);
    setSendRecipients(reset.recipients);
    setRecipientInput(reset.recipientInput);
    setSendChannels(reset.channels);
  }

  function addRecipient() {
    const value = recipientInput.trim();
    if (!value) return;
    if (!sendRecipients.includes(value)) {
      setSendRecipients((prev) => [...prev, value]);
    }
    setRecipientInput('');
  }

  function removeRecipient(recipient: string) {
    setSendRecipients((prev) => prev.filter((r) => r !== recipient));
  }

  function toggleChannel(channel: MessageChannel, checked: boolean) {
    setSendChannels((prev) =>
      checked ? [...prev, channel] : prev.filter((c) => c !== channel),
    );
  }

  function handleExport() {
    toast.info('Exportação em breve.');
  }

  const columnDefinitions = useMemo<GridColumnDef<MessageTemplate>[]>(
    () => [
      {
        id: 'select',
        label: '#',
        pinned: 'start',
        hideable: false,
        className: 'w-[40px]',
        render: (template) => (
          <Checkbox
            checked={grid.selected.includes(template.id)}
            onCheckedChange={() => grid.toggleSelect(template.id)}
            onClick={(event) => event.stopPropagation()}
          />
        ),
      },
      {
        id: 'id',
        label: 'Id',
        sortable: true,
        sortKey: 'id',
        className: 'w-[70px] text-sm text-muted-foreground',
        render: (template) => template.id,
      },
      {
        id: 'actions',
        label: 'Ações',
        hideable: false,
        className: 'w-[72px]',
        render: (template) => (
          <GridRowActions
            actions={[
              {
                label: 'Enviar',
                icon: Send,
                hidden: !template.is_active,
                onClick: () => openSendDialog(template),
              },
              {
                label: 'Duplicar',
                icon: Copy,
                disabled: duplicatingId === template.id,
                onClick: () => void handleDuplicate(template.id),
              },
              {
                label: 'Editar',
                icon: Pencil,
                onClick: () => handleEditTemplate(template.id),
              },
            ]}
          />
        ),
      },
      {
        id: 'active',
        label: 'Ativo',
        sortable: true,
        sortKey: 'is_active',
        filter: {
          type: 'select',
          filterKey: 'status',
          placeholder: 'Todos',
          options: STATUS_FILTER_OPTIONS,
        },
        className: 'w-[80px]',
        render: (template) => (
          <Switch
            size="sm"
            checked={template.is_active}
            disabled={rowStatusId === template.id}
            onCheckedChange={(checked) => void handleRowStatusChange(template, checked)}
          />
        ),
      },
      {
        id: 'name',
        label: 'Nome',
        sortable: true,
        sortKey: 'name',
        filter: { type: 'text', filterKey: 'name', placeholder: 'Nome' },
        className: 'min-w-[200px]',
        render: (template) => <span className="font-medium">{template.name}</span>,
      },
      {
        id: 'slug',
        label: 'Slug',
        sortable: true,
        sortKey: 'slug',
        filter: { type: 'text', filterKey: 'slug', placeholder: 'Slug' },
        className: 'min-w-[160px] font-mono text-sm text-muted-foreground',
        render: (template) => template.slug,
      },
      {
        id: 'merge_tags',
        label: 'Merge Tags',
        className: 'min-w-[180px]',
        render: (template) => (
          <div className="flex flex-wrap gap-1">
            {template.merge_tags?.slice(0, 3).map((tag) => (
              <GridBadge key={tag} variant="outline" className="text-xs font-mono">
                {tag}
              </GridBadge>
            ))}
            {(template.merge_tags?.length ?? 0) > 3 && (
              <GridBadge variant="outline" className="text-xs">
                +{(template.merge_tags?.length ?? 0) - 3}
              </GridBadge>
            )}
          </div>
        ),
      },
    ],
    [
      duplicatingId,
      grid.selected,
      grid.toggleSelect,
      handleEditTemplate,
      rowStatusId,
    ],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const activeFilters = useMemo(() => {
    const items = [];

    if (grid.search.trim()) {
      items.push({
        id: 'search',
        label: 'Busca',
        value: grid.search.trim(),
        onRemove: grid.clearSearch,
      });
    }

    for (const column of columnDefinitions) {
      if (!column.filter) continue;

      const value = columnFilters.filters[column.filter.filterKey]?.trim();
      if (!value) continue;

      const displayValue =
        column.filter.type === 'select'
          ? column.filter.options?.find((option) => option.value === value)?.label ?? value
          : value;

      items.push({
        id: column.filter.filterKey,
        label: column.label,
        value: displayValue,
        onRemove: () => columnFilters.clearFilter(column.filter!.filterKey),
      });
    }

    return items;
  }, [
    columnDefinitions,
    columnFilters.filters,
    columnFilters.clearFilter,
    grid.search,
    grid.clearSearch,
  ]);

  function handleResetColumns() {
    gridColumns.resetColumns();
    toast.success('Colunas restauradas ao padrão.');
  }

  function handleClearFilters() {
    grid.clearSearch();
    columnFilters.clearAllFilters();
    toast.success('Filtros removidos.');
  }

  function handleResetGrid() {
    gridColumns.resetColumns();
    grid.clearSearch();
    columnFilters.clearAllFilters();
    grid.resetSettings();
    toast.success('Grid restaurado ao padrão.');
  }

  const hasActiveFilters = grid.hasFilters || columnFilters.hasFilters;
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onNew={() => navigate('/message-templates/new')}
        onEdit={handleEditSelected}
        onActivate={() => void grid.activateSelected()}
        onDeactivate={() => void grid.deactivateSelected()}
        onDelete={handleDeleteSelected}
        hasSelection={grid.hasSelection && !grid.isTogglingActive}
        singleSelection={grid.singleSelection && !grid.isTogglingActive}
        isTogglingActive={grid.isTogglingActive}
      />
    ),
    [
      navigate,
      grid.activateSelected,
      grid.deactivateSelected,
      grid.hasSelection,
      grid.isTogglingActive,
      grid.singleSelection,
      handleDeleteSelected,
      handleEditSelected,
    ],
  );

  usePageToolbar({
    title: 'Templates de Mensagem',
    description: 'Gerencie templates de mensagens.',
    actions: toolbarActions,
  });

  return (
    <PageBody>
      <GridPanel
        toolbar={
          <GridPanelToolbar
            onSelectAll={() => grid.toggleSelectAll(templates.map((t) => t.id))}
            isAllSelected={grid.isAllSelected(templates.length)}
            selectedCount={grid.selected.length}
            onClearSelection={grid.clearSelection}
            onRefresh={load}
            isRefreshing={loading}
            onExport={handleExport}
            search={grid.search}
            onSearch={grid.setSearch}
            filtersControl={
              <GridFiltersControl
                filters={activeFilters}
                onClearAll={hasActiveFilters ? handleClearFilters : undefined}
              />
            }
            columnsControl={
              <GridColumnsControl
                columns={columnDefinitions}
                order={gridColumns.order}
                hidden={gridColumns.hidden}
                visibleCount={gridColumns.visibleCount}
                totalCount={gridColumns.totalCount}
                isCustomized={gridColumns.isCustomized}
                onOrderChange={gridColumns.setColumnOrder}
                onSetVisibility={gridColumns.setColumnVisibility}
                canHideColumn={gridColumns.canHideColumn}
                onShowAll={gridColumns.showAllColumns}
                onHideAll={gridColumns.hideAllColumns}
                onResetDefault={handleResetColumns}
              />
            }
            resetControl={
              <GridResetControl
                disabled={!isGridCustomized}
                onReset={handleResetGrid}
              />
            }
          />
        }
        footer={
          <GridPagination
            meta={meta}
            onPageChange={grid.setPage}
            onPerPageChange={grid.setPerPage}
          />
        }
      >
        <GridTable
          columns={gridColumns.visibleColumns}
          data={templates}
          getRowKey={(template) => template.id}
          loading={loading}
          emptyMessage="Nenhum template cadastrado."
          sort={grid.sort}
          sortDir={grid.sortDir}
          onSort={grid.toggleSort}
          onColumnOrderChange={gridColumns.reorderDraggableColumns}
          columnFilters={columnFilters.filters}
          onColumnFilterChange={columnFilters.setFilter}
          onColumnFilterClear={columnFilters.clearColumnFilter}
          isRowSelected={(template) => grid.selected.includes(template.id)}
          onRowClick={(template, event) =>
            grid.selectRow(template.id, {
              shift: event.shiftKey,
              rangeOrder: templates.map((item) => item.id),
            })
          }
          onRowDoubleClick={(template) => handleEditTemplate(template.id)}
        />
      </GridPanel>

      <Dialog open={!!sendTemplate} onOpenChange={(open) => !open && closeSendDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar mensagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Template: <strong>{sendTemplate?.name}</strong>
            </p>

            <div className="space-y-2">
              <Label>Destinatários</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="email@exemplo.com ou +5511999999999"
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addRecipient();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addRecipient}>
                  Adicionar
                </Button>
              </div>
              <div className="flex min-h-[32px] flex-wrap gap-1">
                {sendRecipients.map((recipient) => (
                  <GridBadge key={recipient} variant="secondary" className="gap-1">
                    {recipient}
                    <button type="button" onClick={() => removeRecipient(recipient)}>
                      <X className="size-3" />
                    </button>
                  </GridBadge>
                ))}
                {sendRecipients.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Nenhum destinatário adicionado.
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Canais</Label>
              <div className="grid grid-cols-2 gap-3">
                {CHANNEL_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={sendChannels.includes(option.value)}
                      onCheckedChange={(checked) =>
                        toggleChannel(option.value, checked === true)
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => sendMutation.mutate()}
                disabled={
                  sendRecipients.length === 0
                  || sendChannels.length === 0
                  || sendMutation.isPending
                }
              >
                {sendMutation.isPending ? 'Enviando...' : (
                  <>
                    <Send className="size-4 mr-2" /> Enviar
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={closeSendDialog}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={grid.deleteIds.length > 0}
        onOpenChange={(open) => !open && grid.clearDeleteRequest()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {grid.deleteIds.length === 1
                ? 'Remover template'
                : `Remover ${grid.deleteIds.length} templates`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageBody>
  );
}
