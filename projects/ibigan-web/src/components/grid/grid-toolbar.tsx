import type { ReactNode } from 'react';
import {
  CheckSquare2,
  Download,
  Pencil,
  Plus,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { Alert, AlertContent, AlertIcon, AlertTitle, AlertToolbar } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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

export function GridToolbarDivider() {
  return <div className="mx-1 h-5 w-px shrink-0 bg-border" />;
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
}: {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Button
      type="button"
      size="sm"
      disabled={disabled || loading}
      onClick={onClick}
      className="h-8 gap-1.5"
    >
      {Icon && <Icon className="size-4 shrink-0" />}
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

function formatSelectedCount(count: number) {
  if (count === 1) return '1 registro selecionado';
  return `${count} registros selecionados`;
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
}: GridPanelToolbarProps) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="relative border-b border-border">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2.5',
          hasSelection && 'pointer-events-none invisible',
        )}
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

        {onSearch && (
          <GridToolbarSearch
            value={search ?? ''}
            onChange={onSearch}
            placeholder={searchPlaceholder}
            className="ms-auto shrink-0"
          />
        )}
      </div>

      {hasSelection && (
        <Alert
          variant="info"
          appearance="light"
          size="sm"
          className="absolute inset-0 h-full w-full items-center rounded-none border-0 px-4 [&_[data-slot=alert-close]]:mt-0 [&_[data-slot=alert-icon]]:mt-0"
        >
          <AlertIcon>
            <CheckSquare2 />
          </AlertIcon>
          <AlertContent className="flex-1">
            <AlertTitle>{formatSelectedCount(selectedCount)}</AlertTitle>
          </AlertContent>
          {onClearSelection && (
            <AlertToolbar>
              <GridToolbarIconButton
                label="Limpar seleção"
                icon={X}
                onClick={onClearSelection}
              />
            </AlertToolbar>
          )}
        </Alert>
      )}
    </div>
  );
}

export interface StandardGridToolbarProps {
  onNew?: () => void;
  newLabel?: string;

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
      {onNew && <GridToolbarPrimary label={newLabel} icon={Plus} onClick={onNew} />}
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
