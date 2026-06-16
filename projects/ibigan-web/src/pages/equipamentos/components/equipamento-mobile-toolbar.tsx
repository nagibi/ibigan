import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function EquipamentoMobileToolbar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'sticky top-[calc(var(--page-content-header-height,0px)+0.75rem)] z-20 -mx-4 flex flex-col gap-3 bg-background/95 px-4 pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 max-xl:border-b max-xl:border-border/60 max-xl:shadow-sm sm:-mx-5 sm:px-5',
        className,
      )}
    >
      {children}
    </div>
  );
}
