import { useCallback, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface GridTableScrollProps {
  children: ReactNode;
  className?: string;
  /** Fallback max-height when the flex parent chain is unavailable */
  maxHeight?: string;
}

type HorizontalScrollSource = 'viewport' | 'top' | 'bottom';

interface ScrollMetrics {
  contentWidth: number;
  viewportWidth: number;
  hasOverflow: boolean;
}

function measureTableNaturalWidth(table: HTMLTableElement) {
  const clone = table.cloneNode(true) as HTMLTableElement;
  clone.style.position = 'absolute';
  clone.style.visibility = 'hidden';
  clone.style.pointerEvents = 'none';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = 'max-content';
  clone.style.minWidth = 'max-content';

  document.body.appendChild(clone);
  const width = Math.ceil(clone.getBoundingClientRect().width);
  document.body.removeChild(clone);

  return width;
}

function measureScrollMetrics(
  viewport: HTMLDivElement,
  table: HTMLTableElement | null,
): ScrollMetrics {
  const viewportWidth = viewport.clientWidth;
  const naturalWidth = table ? measureTableNaturalWidth(table) : 0;
  const hasOverflow = naturalWidth > viewportWidth + 1;
  const contentWidth = hasOverflow ? naturalWidth : viewportWidth;

  if (table && naturalWidth > 0) {
    if (hasOverflow) {
      table.style.width = `${naturalWidth}px`;
      table.style.minWidth = `${naturalWidth}px`;
    } else {
      table.style.width = '100%';
      table.style.minWidth = `${Math.max(naturalWidth, viewportWidth)}px`;
    }
  }

  return {
    contentWidth,
    viewportWidth,
    hasOverflow,
  };
}

function HorizontalScrollTrack({
  trackRef,
  contentWidth,
  viewportWidth,
  visible,
  position,
  onScroll,
}: {
  trackRef: RefObject<HTMLDivElement | null>;
  contentWidth: number;
  viewportWidth: number;
  visible: boolean;
  position: 'top' | 'bottom';
  onScroll: () => void;
}) {
  const trackWidth = Math.max(contentWidth, viewportWidth + 1);

  return (
    <div
      ref={trackRef}
      className={cn(
        'grid-table-scroll-x w-full min-w-0 shrink-0 overflow-x-scroll overflow-y-hidden bg-muted/50',
        visible ? 'h-4 min-h-4' : 'pointer-events-none invisible !h-0 !min-h-0 border-0 p-0',
        position === 'top' ? 'border-b border-border' : 'border-t border-border',
      )}
      onScroll={onScroll}
      aria-hidden={!visible}
      aria-label={position === 'top' ? 'Scroll horizontal superior da tabela' : 'Scroll horizontal inferior da tabela'}
    >
      <div aria-hidden style={{ width: trackWidth, height: 1 }} />
    </div>
  );
}

export function GridTableScroll({
  children,
  className,
  maxHeight = 'var(--grid-body-max-height)',
}: GridTableScrollProps) {
  const isMobile = useIsMobile();
  const viewportRef = useRef<HTMLDivElement>(null);
  const hTrackTopRef = useRef<HTMLDivElement>(null);
  const hTrackBottomRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const metricsRef = useRef<ScrollMetrics>({ contentWidth: 0, viewportWidth: 0, hasOverflow: false });
  const [metrics, setMetrics] = useState<ScrollMetrics>(metricsRef.current);
  const isSyncingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  const updateMetrics = useCallback(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content || viewport.clientWidth <= 0) return;

    const table = content.querySelector('table');
    const tableEl = table instanceof HTMLTableElement ? table : null;
    const next = measureScrollMetrics(viewport, tableEl);

    const prev = metricsRef.current;
    if (
      prev.contentWidth === next.contentWidth
      && prev.viewportWidth === next.viewportWidth
      && prev.hasOverflow === next.hasOverflow
    ) {
      return;
    }

    metricsRef.current = next;
    setMetrics(next);
  }, []);

  const scheduleMetricsUpdate = useCallback(() => {
    if (rafRef.current !== null) return;

    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateMetrics();
    });
  }, [updateMetrics]);

  const syncScrollLeft = useCallback((source: HorizontalScrollSource) => {
    const viewport = viewportRef.current;
    const top = hTrackTopRef.current;
    const bottom = hTrackBottomRef.current;
    if (!viewport || isSyncingRef.current) return;

    const nextScrollLeft = source === 'viewport'
      ? viewport.scrollLeft
      : source === 'top'
        ? top?.scrollLeft ?? 0
        : bottom?.scrollLeft ?? 0;

    isSyncingRef.current = true;

    if (source !== 'viewport') {
      viewport.scrollLeft = nextScrollLeft;
    }
    if (source !== 'top' && top) {
      top.scrollLeft = nextScrollLeft;
    }
    if (source !== 'bottom' && bottom) {
      bottom.scrollLeft = nextScrollLeft;
    }

    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }, []);

  useLayoutEffect(() => {
    updateMetrics();

    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const resizeObserver = new ResizeObserver(scheduleMetricsUpdate);
    resizeObserver.observe(viewport);

    const table = content.querySelector('table');
    if (table) {
      resizeObserver.observe(table);
    }

    const mutationObserver = new MutationObserver(scheduleMetricsUpdate);
    mutationObserver.observe(content, {
      childList: true,
      subtree: true,
    });

    window.addEventListener('resize', scheduleMetricsUpdate);

    const raf1 = window.requestAnimationFrame(updateMetrics);
    const raf2 = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(updateMetrics);
    });
    const timeout1 = window.setTimeout(updateMetrics, 150);
    const timeout2 = window.setTimeout(updateMetrics, 500);
    const timeout3 = window.setTimeout(updateMetrics, 1000);

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(timeout1);
      window.clearTimeout(timeout2);
      window.clearTimeout(timeout3);
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('resize', scheduleMetricsUpdate);
    };
  }, [children, isMobile, scheduleMetricsUpdate, updateMetrics]);

  useLayoutEffect(() => {
    if (!metrics.hasOverflow) return;
    syncScrollLeft('viewport');
  }, [metrics.contentWidth, metrics.hasOverflow, metrics.viewportWidth, syncScrollLeft]);

  return (
    <div
      className={cn(
        'grid-table-scroll-host flex h-0 min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden',
        className,
      )}
      style={isMobile ? undefined : { maxHeight }}
    >
      <HorizontalScrollTrack
        trackRef={hTrackTopRef}
        contentWidth={metrics.contentWidth}
        viewportWidth={metrics.viewportWidth}
        visible={!isMobile && metrics.hasOverflow}
        position="top"
        onScroll={() => syncScrollLeft('top')}
      />

      <div
        ref={viewportRef}
        className={cn(
          'grid-table-scroll grid-table-scroll-y min-h-0 min-w-0 w-full max-w-full flex-1 basis-0 overflow-y-auto',
          isMobile ? 'overflow-x-auto' : 'grid-table-scroll-y-hide-x',
        )}
        onScroll={() => syncScrollLeft('viewport')}
      >
        <div
          ref={contentRef}
          className={cn(
            'min-w-full align-top',
            !isMobile && metrics.hasOverflow ? 'inline-block w-max' : 'block w-full',
          )}
          style={!isMobile && metrics.hasOverflow && metrics.contentWidth > 0 ? { width: metrics.contentWidth } : undefined}
        >
          {children}
        </div>
      </div>

      <HorizontalScrollTrack
        trackRef={hTrackBottomRef}
        contentWidth={metrics.contentWidth}
        viewportWidth={metrics.viewportWidth}
        visible={!isMobile && metrics.hasOverflow}
        position="bottom"
        onScroll={() => syncScrollLeft('bottom')}
      />
    </div>
  );
}
