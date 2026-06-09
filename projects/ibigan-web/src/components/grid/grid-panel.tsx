import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function GridPanel({
  toolbar,
  children,
  footer,
  className,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-border bg-card', className)}>
      {toolbar}
      <div className="min-w-0">{children}</div>
      {footer ? <div className="border-t border-border">{footer}</div> : null}
    </div>
  );
}
