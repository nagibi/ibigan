import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

function GridPanelBar({ children, position }: { children: ReactNode; position: 'top' | 'bottom' }) {
  return (
    <div
      className={cn(
        'border-border',
        position === 'top' ? 'border-b' : 'border-t',
      )}
    >
      {children}
    </div>
  );
}

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
    <div className={cn('flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card', className)}>
      {header}
      {toolbar}
      {footer ? <GridPanelBar position="top">{footer}</GridPanelBar> : null}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      {footer ? <GridPanelBar position="bottom">{footer}</GridPanelBar> : null}
    </div>
  );
}
