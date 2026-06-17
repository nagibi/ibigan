import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export const GRID_STATUS_COLUMN_IDS = new Set([
  'is_ativo',
  'is_ativa',
  'is_active',
  'status',
]);

export function isGridStatusColumn(columnId: string) {
  return GRID_STATUS_COLUMN_IDS.has(columnId);
}

type GridStatusSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
  className?: string;
};

export function GridStatusSwitch({
  checked,
  disabled,
  onCheckedChange,
  className,
}: GridStatusSwitchProps) {
  return (
    <Switch
      checked={checked}
      disabled={disabled}
      className={cn('shrink-0', className)}
      onClick={(event) => event.stopPropagation()}
      onCheckedChange={onCheckedChange}
    />
  );
}
