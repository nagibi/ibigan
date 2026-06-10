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
    <div className={cn('container pb-6', className)}>
      {children}
    </div>
  );
}
