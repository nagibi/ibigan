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
  maxHeight = 'calc(100vh - 18rem)',
}: GridTableScrollProps) {
  return (
    <div
      className={cn(
        'grid-table-scroll w-full max-w-full min-h-0 min-w-0 overflow-x-auto overflow-y-auto',
        className,
      )}
      style={{ maxHeight }}
    >
      <div className="inline-block min-w-full w-max">{children}</div>
    </div>
  );
}
