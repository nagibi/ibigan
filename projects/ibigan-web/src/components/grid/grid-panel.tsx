import { useEffect, useRef, type ReactNode } from 'react';
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
  const panelRef = useRef<HTMLDivElement>(null);
  const chromeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const chrome = chromeRef.current;
    if (!panel || !chrome) return undefined;

    const syncChromeHeight = () => {
      const height = chrome.offsetHeight;
      panel.style.setProperty('--grid-panel-chrome-height', `${height}px`);
    };

    syncChromeHeight();

    const resizeObserver = new ResizeObserver(syncChromeHeight);
    resizeObserver.observe(chrome);

    return () => resizeObserver.disconnect();
  }, [toolbar, footer]);

  return (
    <div
      ref={panelRef}
      className={cn(
        'grid-panel flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col rounded-lg border border-border bg-card',
        'max-xl:max-w-full max-xl:flex-none max-xl:overflow-visible',
        'xl:overflow-hidden',
        className,
      )}
    >
      {header}
      {toolbar ? (
        <div ref={chromeRef} className="grid-panel-chrome min-w-0 shrink-0 bg-card">
          {toolbar}
          {footer ? (
            <GridPanelBar position="top" className="border-t xl:hidden">
              {footer}
            </GridPanelBar>
          ) : null}
        </div>
      ) : null}
      <div className="grid-panel-body flex w-full min-w-0 max-w-full flex-col max-xl:h-auto max-xl:max-w-full max-xl:flex-none max-xl:overflow-visible xl:h-0 xl:min-h-0 xl:flex-1 xl:overflow-hidden">
        {children}
      </div>
      {footer ? (
        <GridPanelBar
          position="bottom"
          className="grid-panel-footer hidden shrink-0 bg-card xl:block"
        >
          {footer}
        </GridPanelBar>
      ) : null}
    </div>
  );
}
