import type { ReactNode } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface ToolbarTooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export function ToolbarTooltip({
  content,
  children,
  side = 'bottom',
  className,
}: ToolbarTooltipProps) {
  if (!content) {
    return <>{children}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex', className)}>{children}</span>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        variant="light"
        className="max-w-xs whitespace-normal text-left"
      >
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
