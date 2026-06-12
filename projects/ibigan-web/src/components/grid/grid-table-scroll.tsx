import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GridTableScrollProps {
  children: ReactNode;
  className?: string;
  maxHeight?: string;
}

export function GridTableScroll({
  children,
  className,
  maxHeight = 'calc(100vh - 18rem - var(--impersonation-banner-height, 0px))',
}: GridTableScrollProps) {
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
  }, [children]);

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
        style={{ maxHeight }}
        onScroll={() => syncScrollLeft('body')}
      >
        <div ref={contentRef} className="w-max min-w-full">
          {children}
        </div>
      </div>
    </div>
  );
}
