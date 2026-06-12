import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface GridTableScrollProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
  minHeight?: string;
}

export function GridTableScroll({
  children,
  className,
  maxHeight = 'var(--grid-body-max-height, calc(100dvh - 18rem - var(--impersonation-banner-height, 0px)))',
  minHeight = 'var(--grid-body-min-height, 8rem)',
}: GridTableScrollProps) {
  const isMobile = useIsMobile();
  const bodyRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);
  const isSyncingRef = useRef(false);

  const syncScrollLeft = useCallback((source: 'top' | 'body') => {
    const body = bodyRef.current;
    const top = topRef.current;
    if (!body || !top || isSyncingRef.current) return;

    isSyncingRef.current = true;
    if (source === 'top') {
      body.scrollLeft = top.scrollLeft;
    } else {
      top.scrollLeft = body.scrollLeft;
    }
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }, []);

  useEffect(() => {
    const body = bodyRef.current;
    const content = contentRef.current;
    if (!body || !content) return;

    const updateMetrics = () => {
      const nextScrollWidth = content.scrollWidth;
      setScrollWidth(nextScrollWidth);
      setHasHorizontalOverflow(nextScrollWidth > body.clientWidth + 1);
    };

    updateMetrics();

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(body);
    resizeObserver.observe(content);

    return () => resizeObserver.disconnect();
  }, [children, isMobile]);

  if (isMobile) {
    return (
      <div className={cn('grid-table-scroll-mobile flex w-full min-w-0 flex-col', className)}>
        {hasHorizontalOverflow && (
          <div
            ref={topRef}
            className="grid-table-scroll grid-table-scroll-top shrink-0 overflow-x-auto overflow-y-hidden border-b border-border"
            onScroll={() => syncScrollLeft('top')}
            aria-hidden
          >
            <div style={{ width: scrollWidth, height: 1 }} />
          </div>
        )}
        <div
          ref={bodyRef}
          className="grid-table-scroll w-full min-w-0 overflow-x-auto"
          onScroll={() => syncScrollLeft('body')}
        >
          <div ref={contentRef} className="w-max min-w-full">
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col', className)}>
      {hasHorizontalOverflow && (
        <div
          ref={topRef}
          className="grid-table-scroll grid-table-scroll-top shrink-0 overflow-x-auto overflow-y-hidden border-b border-border"
          onScroll={() => syncScrollLeft('top')}
          aria-hidden
        >
          <div style={{ width: scrollWidth, height: 1 }} />
        </div>
      )}
      <div
        ref={bodyRef}
        className="grid-table-scroll min-h-0 w-full min-w-0 flex-1"
        style={{ maxHeight, minHeight }}
        onScroll={() => syncScrollLeft('body')}
      >
        <div ref={contentRef} className="w-max min-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
