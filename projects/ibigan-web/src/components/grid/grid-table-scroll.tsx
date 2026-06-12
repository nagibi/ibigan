import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GridTableScrollProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
}

export function GridTableScroll({
  children,
  className,
  maxHeight = 'calc(100vh - 18rem - var(--impersonation-banner-height, 0px))',
}: GridTableScrollProps) {
  return (
    <div
      className={cn('grid-table-scroll min-h-0 w-full min-w-0 flex-1', className)}
      style={{ maxHeight }}
    >
      <div className="w-max min-w-full">{children}</div>
    </div>
  );
}
