import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
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
  icon: Icon,
  onClick,
  disabled,
  loading,
  tone,
  className,
}: {
  label: string;
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
  );
}

export function GridToolbarIconButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  loading,
  tone,
}: {
  label: string;
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
    <Button
      type="button"
      variant="ghost"
      size="sm"
      mode="icon"
      disabled={disabled || loading}
      onClick={onClick}
      title={label}
      className={cn('size-8 shrink-0', toneClass)}
    >
      <Icon className="size-4" />
    </Button>
  );
}

export function GridToolbarPrimary({
  label,
  icon: Icon,
  onClick,
  disabled,
  loading,
  variant = 'primary',
}: {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: VariantProps<typeof buttonVariants>['variant'];
}) {
  return (
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
  );
}

export function GridToolbarSearch({
  value,
  onChange,
  placeholder = 'Buscar...',
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
        aria-label="Limpar seleção"
      />
    ),
    actions: onClearSelection ? (
      <GridToolbarIconButton
        label="Limpar seleção"
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
  selectAllLabel = 'Selecionar todos',
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
  const selectionAlert = buildSelectionAlert(selectedCount, onClearSelection);

  return (
    <div className="border-b border-border">
      <ToolbarAlertHost
        alert={selectionAlert}
        contentClassName="flex items-center gap-3 px-4 py-2.5"
      >
        <GridToolbarGroup>
          {onSelectAll && (
            <label className="flex cursor-pointer items-center gap-2 pe-1 text-xs font-medium text-muted-foreground">
              <Checkbox checked={isAllSelected} onCheckedChange={onSelectAll} />
              {selectAllLabel}
            </label>
          )}
          {onRefresh && (
            <GridToolbarButton
              label="Atualizar"
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
              label="Exportar"
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
              placeholder={searchPlaceholder}
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
  newLabel = 'Novo',
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
  return (
    <GridToolbarRoot>
      {onNew && (
        <GridToolbarPrimary
          label={newLabel}
          icon={Plus}
          onClick={onNew}
          variant={newVariant}
        />
      )}
      {onEdit && (
        <GridToolbarButton
          label="Editar"
          icon={Pencil}
          disabled={!singleSelection}
          onClick={onEdit}
        />
      )}
      {onActivate && (
        <GridToolbarButton
          label="Ativar"
          icon={Power}
          disabled={!hasSelection || isTogglingActive}
          loading={isTogglingActive}
          onClick={onActivate}
        />
      )}
      {onDeactivate && (
        <GridToolbarButton
          label="Inativar"
          icon={PowerOff}
          disabled={!hasSelection || isTogglingActive}
          loading={isTogglingActive}
          onClick={onDeactivate}
        />
      )}
      {onDelete && (
        <GridToolbarButton
          label="Excluir"
          icon={Trash2}
          disabled={!hasSelection}
          onClick={onDelete}
        />
      )}
      {onRefresh && (
        <GridToolbarButton
          label="Atualizar"
          icon={RefreshCw}
          onClick={onRefresh}
          loading={isRefreshing}
        />
      )}
      {onExport && (
        <GridToolbarButton
          label="Exportar"
          icon={Download}
          onClick={onExport}
          loading={isExporting}
        />
      )}
      {onSearch && <GridToolbarSearch value={search ?? ''} onChange={onSearch} />}
      {extra}
    </GridToolbarRoot>
  );
}
