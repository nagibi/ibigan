import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePageScrollRef } from '@/providers/page-scroll-provider';

const SCROLL_ROOT_SELECTORS = [
  '.page-content-scroll',
  '.grid-table-scroll-y',
  '.grid-table-scroll',
] as const;

export function collectPageScrollContainers(pageScroll: HTMLElement | null | undefined) {
  const containers = new Set<HTMLElement>();

  if (pageScroll) {
    containers.add(pageScroll);
  }

  for (const selector of SCROLL_ROOT_SELECTORS) {
    document.querySelectorAll<HTMLElement>(selector).forEach((element) => {
      containers.add(element);
    });
  }

  return Array.from(containers);
}

export function getMaxPageScrollTop(pageScroll: HTMLElement | null | undefined) {
  let maxScroll = Math.max(
    window.scrollY,
    document.documentElement.scrollTop,
    document.body.scrollTop,
  );

  for (const container of collectPageScrollContainers(pageScroll)) {
    maxScroll = Math.max(maxScroll, container.scrollTop);
  }

  return maxScroll;
}

export function scrollAllPageContainersToTop(pageScroll: HTMLElement | null | undefined) {
  for (const container of collectPageScrollContainers(pageScroll)) {
    container.scrollTo({ top: 0, behavior: 'smooth' });
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function usePageScrollPosition(onChange: (scrollTop: number) => void) {
  const { pathname } = useLocation();
  const pageScrollRef = usePageScrollRef();
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const notify = useCallback(() => {
    onChangeRef.current(getMaxPageScrollTop(pageScrollRef?.current));
  }, [pageScrollRef]);

  useEffect(() => {
    const boundHandlers = new Map<HTMLElement, EventListener>();

    const syncBindings = () => {
      const containers = collectPageScrollContainers(pageScrollRef?.current);
      const nextContainers = new Set(containers);

      for (const [element, handler] of boundHandlers) {
        if (!nextContainers.has(element)) {
          element.removeEventListener('scroll', handler);
          boundHandlers.delete(element);
        }
      }

      for (const element of containers) {
        if (boundHandlers.has(element)) {
          continue;
        }

        const handler = () => {
          notify();
        };

        element.addEventListener('scroll', handler, { passive: true });
        boundHandlers.set(element, handler);
      }

      notify();
    };

    syncBindings();

    let rafId: number | undefined;
    const scheduleNotify = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(notify);
    };

    const mutationObserver = new MutationObserver(syncBindings);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const pollId = window.setInterval(syncBindings, 500);
    window.addEventListener('resize', scheduleNotify, { passive: true });
    window.addEventListener('wheel', scheduleNotify, { passive: true, capture: true });
    window.addEventListener('touchmove', scheduleNotify, { passive: true, capture: true });

    return () => {
      mutationObserver.disconnect();
      window.clearInterval(pollId);
      window.removeEventListener('resize', scheduleNotify);
      window.removeEventListener('wheel', scheduleNotify, { capture: true });
      window.removeEventListener('touchmove', scheduleNotify, { capture: true });

      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      for (const [element, handler] of boundHandlers) {
        element.removeEventListener('scroll', handler);
      }
    };
  }, [notify, pageScrollRef, pathname]);
}
