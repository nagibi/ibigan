import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

function GridPanelBar({
  children,
  position,
  className,
}: {
  children: ReactNode;
  position: 'top' | 'bottom';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border',
        position === 'top' ? 'border-b' : 'border-t',
        className,
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
    <div className={cn('grid-panel flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card max-lg:overflow-visible max-lg:flex-none', className)}>
      {header}
      {toolbar}
      {footer ? <GridPanelBar position="top">{footer}</GridPanelBar> : null}
      <div className="grid-panel-body flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden max-lg:overflow-visible max-lg:flex-none">
        {children}
      </div>
      {footer ? (
        <GridPanelBar position="bottom" className="hidden lg:block">
          {footer}
        </GridPanelBar>
      ) : null}
    </div>
  );
}
