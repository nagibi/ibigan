import type { LucideIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import { useHoverDropdown } from '@/hooks/use-hover-dropdown';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type GridRowActionIcon = LucideIcon | ComponentType<{ className?: string }>;

export interface GridRowAction {
  label: string;
  tooltip?: string;
  icon: GridRowActionIcon;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
  tone?: 'default' | 'destructive';
}

interface GridRowActionsProps {
  actions: GridRowAction[];
}

function isViewGridAction(label: string, viewLabel: string): boolean {
  const normalized = label.trim().toLowerCase();

  return label === viewLabel || normalized === 'visualizar' || normalized === 'view';
}

export function prioritizeViewGridAction(
  actions: GridRowAction[],
  viewLabel: string,
): GridRowAction[] {
  const viewIndex = actions.findIndex((action) => isViewGridAction(action.label, viewLabel));

  if (viewIndex <= 0) {
    return actions;
  }

  const reordered = [...actions];
  const [viewAction] = reordered.splice(viewIndex, 1);

  return [viewAction, ...reordered];
}

export function GridRowActions({ actions }: GridRowActionsProps) {
  const { t } = useTranslation();
  const hover = useHoverDropdown();
  const visibleActions = useMemo(() => {
    const filtered = actions.filter((action) => !action.hidden);

    return prioritizeViewGridAction(filtered, t('common.view'));
  }, [actions, t]);

  if (visibleActions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu open={hover.open} onOpenChange={hover.setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2.5 text-xs font-normal"
          aria-label={t('columns.actions')}
          data-grid-no-row-select
          onMouseEnter={hover.handleEnter}
          onMouseLeave={hover.handleLeave}
          onClick={(event) => event.stopPropagation()}
        >
          {t('columns.actions')}
          <ChevronDown className="size-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-44"
        onMouseEnter={hover.handleEnter}
        onMouseLeave={hover.handleLeave}
      >
        {visibleActions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            disabled={action.disabled}
            className={cn(
              'font-normal',
              action.tone === 'destructive' && 'text-destructive focus:text-destructive',
            )}
            onClick={(event) => {
              event.stopPropagation();
              action.onClick();
            }}
          >
            {action.icon ? <action.icon className="size-4" /> : null}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
