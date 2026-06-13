import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface InfoHintProps {
  content: string;
  className?: string;
  iconClassName?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function InfoHint({
  content,
  className,
  iconClassName,
  side = 'top',
}: InfoHintProps) {
  const isMobile = useIsMobile();

  const trigger = (
    <button
      type="button"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      aria-label={content}
    >
      <Info className={cn('size-3.5', iconClassName)} aria-hidden="true" />
    </button>
  );

  if (isMobile) {
    return (
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="start"
          side={side}
          className="w-auto max-w-[min(18rem,calc(100vw-2rem))] p-3 text-xs leading-relaxed"
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
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
