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
    <div className={cn('container !max-w-full flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-6', className)}>
      {children}
    </div>
  );
}
