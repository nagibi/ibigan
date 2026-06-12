import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/i18next';
import {
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  formatToolbarSelectedCount,
  ToolbarAlertHost,
  type ToolbarAlertConfig,
} from './toolbar-alert';
import { ToolbarTooltip } from './toolbar-tooltip';

export function GridToolbarRoot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center justify-start gap-0.5', className)}>
      {children}
    </div>
  );
}

export function GridToolbarGroup({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

export function GridToolbarSpacer() {
  return <div className="flex-1" />;
}

export function GridToolbarButton({
  label,
  tooltip,
  icon: Icon,
  onClick,
  disabled,
  loading,
  tone,
  className,
}: {
  label: string;
  tooltip?: string;
  icon?: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}) {
  const toneClass = {
    default: '',
    success: 'text-green-600 hover:text-green-700',
    warning: 'text-orange-500 hover:text-orange-600',
    destructive: 'text-destructive hover:text-destructive/90',
  }[tone ?? 'default'];

  return (
    <ToolbarTooltip content={tooltip ?? label}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled || loading}
        onClick={onClick}
        className={cn('h-8 gap-1.5 px-2 text-xs font-medium', toneClass, className)}
      >
        {Icon && <Icon className="size-3.5 shrink-0" />}
        {label}
      </Button>
    </ToolbarTooltip>
  );
}

export function GridToolbarIconButton({
  label,
  tooltip,
  icon: Icon,
  onClick,
  disabled,
  loading,
  tone,
}: {
  label: string;
  tooltip?: string;
  icon: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const toneClass = {
    default: '',
    success: 'text-green-600 hover:text-green-700',
    warning: 'text-orange-500 hover:text-orange-600',
    destructive: 'text-destructive hover:text-destructive/90',
  }[tone ?? 'default'];

  return (
    <ToolbarTooltip content={tooltip ?? label}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        mode="icon"
        disabled={disabled || loading}
        onClick={onClick}
        className={cn('size-8 shrink-0', toneClass)}
      >
        <Icon className="size-4" />
      </Button>
    </ToolbarTooltip>
  );
}

export function GridToolbarPrimary({
  label,
  tooltip,
  icon: Icon,
  onClick,
  disabled,
  loading,
  variant = 'primary',
}: {
  label: string;
  tooltip?: string;
  icon?: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: VariantProps<typeof buttonVariants>['variant'];
}) {
  return (
    <ToolbarTooltip content={tooltip ?? label}>
      <Button
        type="button"
        variant={variant}
        size="sm"
        disabled={disabled || loading}
        onClick={onClick}
        className="h-8 gap-1.5"
      >
        {loading
          ? <LoaderCircle className="size-4 shrink-0 animate-spin" />
          : Icon && <Icon className="size-4 shrink-0" />
        }
        {label}
      </Button>
    </ToolbarTooltip>
  );
}

export function GridToolbarSearch({
  value,
  onChange,
  placeholder = i18n.t('grid.search_placeholder'),
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-72 pl-9 text-sm"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          mode="icon"
          className="absolute right-1 top-1/2 size-6 -translate-y-1/2"
          onClick={() => onChange('')}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}

export function buildSelectionAlert(
  selectedCount: number,
  onClearSelection?: () => void,
): ToolbarAlertConfig | null {
  if (selectedCount <= 0) return null;

  const clearSelectionLabel = i18n.t('grid.clear_selection');

  return {
    variant: 'info',
    title: formatToolbarSelectedCount(selectedCount),
    autoDismissMs: false,
    id: selectedCount,
    onClose: onClearSelection,
    icon: (
      <Checkbox
        checked
        onCheckedChange={(checked) => {
          if (checked === false) onClearSelection?.();
        }}
        aria-label={clearSelectionLabel}
      />
    ),
    actions: onClearSelection ? (
      <GridToolbarIconButton
        label={clearSelectionLabel}
        icon={X}
        onClick={onClearSelection}
      />
    ) : undefined,
  };
}

export interface GridPanelToolbarProps {
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  selectAllLabel?: string;
  selectedCount?: number;
  onClearSelection?: () => void;

  onRefresh?: () => void;
  isRefreshing?: boolean;
  onExport?: () => void;
  isExporting?: boolean;

  search?: string;
  onSearch?: (v: string) => void;
  searchPlaceholder?: string;

  columnsControl?: ReactNode;
  filtersControl?: ReactNode;
  resetControl?: ReactNode;
  quickFiltersControl?: ReactNode;
}

export function GridPanelToolbar({
  onSelectAll,
  isAllSelected = false,
  selectAllLabel,
  selectedCount = 0,
  onClearSelection,
  onRefresh,
  isRefreshing,
  onExport,
  isExporting,
  search,
  onSearch,
  searchPlaceholder,
  columnsControl,
  filtersControl,
  resetControl,
  quickFiltersControl,
}: GridPanelToolbarProps) {
  const { t } = useTranslation();
  const resolvedSelectAllLabel = selectAllLabel ?? t('grid.select_all');
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('grid.search_placeholder');
  const selectionAlert = buildSelectionAlert(selectedCount, onClearSelection);

  return (
    <div className="border-b border-border">
      <ToolbarAlertHost
        alert={selectionAlert}
        contentClassName="flex items-center gap-3 px-4 py-2.5"
      >
        <GridToolbarGroup>
          {onSelectAll && (
            <ToolbarTooltip content={t('grid.tooltip.select_all')}>
              <label className="flex cursor-pointer items-center gap-2 pe-1 text-xs font-medium text-muted-foreground">
                <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
                {resolvedSelectAllLabel}
              </label>
            </ToolbarTooltip>
          )}
          {onRefresh && (
            <GridToolbarButton
              label={t('grid.refresh')}
              tooltip={t('grid.tooltip.refresh')}
              icon={RefreshCw}
              onClick={onRefresh}
              loading={isRefreshing}
            />
          )}
          {filtersControl}
          {columnsControl}
          {resetControl}
          {onExport && (
            <GridToolbarButton
              label={t('grid.export')}
              tooltip={t('grid.tooltip.export')}
              icon={Download}
              onClick={onExport}
              loading={isExporting}
            />
          )}
        </GridToolbarGroup>

        <GridToolbarSpacer />

        <div className="ms-auto flex shrink-0 items-center gap-2">
          {quickFiltersControl}
          {onSearch && (
            <GridToolbarSearch
              value={search ?? ''}
              onChange={onSearch}
              placeholder={resolvedSearchPlaceholder}
            />
          )}
        </div>
      </ToolbarAlertHost>
    </div>
  );
}

export interface StandardGridToolbarProps {
  onNew?: () => void;
  newLabel?: string;
  newVariant?: VariantProps<typeof buttonVariants>['variant'];

  onEdit?: () => void;
  onDelete?: () => void;
  onActivate?: () => void;
  onDeactivate?: () => void;
  hasSelection?: boolean;
  singleSelection?: boolean;
  isTogglingActive?: boolean;

  onRefresh?: () => void;
  isRefreshing?: boolean;
  onExport?: () => void;
  isExporting?: boolean;

  search?: string;
  onSearch?: (v: string) => void;

  extra?: ReactNode;
}

export function StandardGridToolbar({
  onNew,
  newLabel,
  newVariant = 'primary',
  onEdit,
  onDelete,
  onActivate,
  onDeactivate,
  hasSelection = false,
  singleSelection = false,
  isTogglingActive = false,
  onRefresh,
  isRefreshing,
  onExport,
  isExporting,
  search,
  onSearch,
  extra,
}: StandardGridToolbarProps) {
  const { t } = useTranslation();
  const resolvedNewLabel = newLabel ?? t('common.new');

  return (
    <GridToolbarRoot>
      {onNew && (
        <GridToolbarPrimary
          label={resolvedNewLabel}
          tooltip={t('grid.tooltip.new')}
          icon={Plus}
          onClick={onNew}
          variant={newVariant}
        />
      )}
      {onEdit && (
        <GridToolbarButton
          label={t('common.edit')}
          tooltip={t('grid.tooltip.edit')}
          icon={Pencil}
          disabled={!singleSelection}
          onClick={onEdit}
        />
      )}
      {onActivate && (
        <GridToolbarButton
          label={t('common.activate')}
          tooltip={t('grid.tooltip.activate')}
          icon={Power}
          disabled={!hasSelection || isTogglingActive}
          loading={isTogglingActive}
          onClick={onActivate}
        />
      )}
      {onDeactivate && (
        <GridToolbarButton
          label={t('common.deactivate')}
          tooltip={t('grid.tooltip.deactivate')}
          icon={PowerOff}
          disabled={!hasSelection || isTogglingActive}
          loading={isTogglingActive}
          onClick={onDeactivate}
        />
      )}
      {onDelete && (
        <GridToolbarButton
          label={t('common.delete')}
          tooltip={t('grid.tooltip.delete')}
          icon={Trash2}
          disabled={!hasSelection}
          onClick={onDelete}
        />
      )}
      {onRefresh && (
        <GridToolbarButton
          label={t('grid.refresh')}
          tooltip={t('grid.tooltip.refresh')}
          icon={RefreshCw}
          onClick={onRefresh}
          loading={isRefreshing}
        />
      )}
      {onExport && (
        <GridToolbarButton
          label={t('grid.export')}
          tooltip={t('grid.tooltip.export')}
          icon={Download}
          onClick={onExport}
          loading={isExporting}
        />
      )}
      {onSearch && (
        <GridToolbarSearch
          value={search ?? ''}
          onChange={onSearch}
          placeholder={t('grid.search_placeholder')}
        />
      )}
      {extra}
    </GridToolbarRoot>
  );
}
