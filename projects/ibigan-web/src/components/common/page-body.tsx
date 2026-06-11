import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function PageBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('page-content-scroll container !max-w-full flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto pb-6', className)}>
      {children}
    </div>
  );
}
