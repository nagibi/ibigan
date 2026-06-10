import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FormFieldGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {children}
    </div>
  );
}

export function FormFieldGridItem({
  children,
  className,
  span = 1,
}: {
  children: ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4;
}) {
  const spanClass = {
    1: '',
    2: 'sm:col-span-2 xl:col-span-2',
    3: 'sm:col-span-2 xl:col-span-3',
    4: 'sm:col-span-2 xl:col-span-4',
  }[span];

  return <div className={cn(spanClass, className)}>{children}</div>;
}
