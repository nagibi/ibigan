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
    <div className={cn('container-fluid !max-w-full flex min-h-0 min-w-0 w-full max-w-full flex-1 flex-col overflow-x-hidden pb-6 max-xl:flex-none max-xl:pb-6 max-xl:pt-0', className)}>
      {children}
    </div>
  );
}
