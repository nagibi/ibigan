import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GridPanel({
  header,
  toolbar,
  children,
  footer,
  className,
}: {
  header?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card', className)}>
      {header}
      {toolbar}
      <div className="min-h-0 min-w-0 flex-1">{children}</div>
      {footer ? <div className="border-t border-border">{footer}</div> : null}
    </div>
  );
}
