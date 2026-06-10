import type { LucideIcon } from 'lucide-react';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface GridRowAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
  tone?: 'default' | 'destructive';
}

interface GridRowActionsProps {
  actions: GridRowAction[];
}

export function GridRowActions({ actions }: GridRowActionsProps) {
  const visibleActions = actions.filter((action) => !action.hidden);

  if (visibleActions.length === 0) {
    return null;
  }

  if (visibleActions.length <= 2) {
    return (
      <div className="flex items-center gap-0.5" data-grid-no-row-select>
        {visibleActions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant="ghost"
            mode="icon"
            size="sm"
            title={action.label}
            disabled={action.disabled}
            onClick={(event) => {
              event.stopPropagation();
              action.onClick();
            }}
            className={cn(
              action.tone === 'destructive' && 'text-destructive hover:text-destructive/90',
            )}
          >
            <action.icon className="size-4" />
          </Button>
        ))}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          mode="icon"
          size="sm"
          data-grid-no-row-select
          onClick={(event) => event.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {visibleActions.map((action) => (
          <DropdownMenuItem
            key={action.label}
            disabled={action.disabled}
            className={cn(action.tone === 'destructive' && 'text-destructive focus:text-destructive')}
            onClick={(event) => {
              event.stopPropagation();
              action.onClick();
            }}
          >
            <action.icon className="size-4" />
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
