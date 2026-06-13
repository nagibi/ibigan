import { LoaderCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { getMaxPageScrollTop } from '@/hooks/use-page-scroll-containers';
import { cn } from '@/lib/utils';
import { usePageRefreshState } from '@/providers/page-refresh-provider';
import { usePageScrollRef } from '@/providers/page-scroll-provider';

const PULL_THRESHOLD = 72;
const MAX_PULL = 112;
const PULL_RESISTANCE = 0.5;

function isOverlayOpen() {
  return Boolean(
    document.querySelector('[data-state="open"][role="dialog"]')
    || document.querySelector('[data-state="open"][data-slot="sheet-content"]'),
  );
}

export function MobilePullToRefresh() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const scrollRef = usePageScrollRef();
  const { onRefresh, isRefreshing } = usePageRefreshState();
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  useEffect(() => {
    if (!isMobile || !onRefresh) {
      setPullDistance(0);
      setIsPulling(false);
      pullingRef.current = false;
      pullDistanceRef.current = 0;
    }
  }, [isMobile, onRefresh]);

  useEffect(() => {
    if (!isMobile || !onRefresh) return;

    const scrollElement = scrollRef?.current;
    if (!scrollElement) return;

    const resetPull = () => {
      pullingRef.current = false;
      pullDistanceRef.current = 0;
      setIsPulling(false);
      setPullDistance(0);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (isRefreshing || isOverlayOpen()) return;
      if (getMaxPageScrollTop(scrollRef?.current) > 0) return;

      startYRef.current = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (isRefreshing || isOverlayOpen()) return;

      const currentY = event.touches[0]?.clientY ?? 0;
      const deltaY = currentY - startYRef.current;

      if (!pullingRef.current) {
        if (deltaY <= 0 || getMaxPageScrollTop(scrollRef?.current) > 0) {
          return;
        }

        pullingRef.current = true;
        setIsPulling(true);
      }

      const nextDistance = Math.min(MAX_PULL, deltaY * PULL_RESISTANCE);
      pullDistanceRef.current = nextDistance;
      setPullDistance(nextDistance);

      if (nextDistance > 0) {
        event.preventDefault();
      }
    };

    const onTouchEnd = () => {
      if (!pullingRef.current) return;

      const shouldRefresh = pullDistanceRef.current >= PULL_THRESHOLD;

      resetPull();

      if (shouldRefresh && !isRefreshing) {
        onRefresh();
      }
    };

    scrollElement.addEventListener('touchstart', onTouchStart, { passive: true });
    scrollElement.addEventListener('touchmove', onTouchMove, { passive: false });
    scrollElement.addEventListener('touchend', onTouchEnd, { passive: true });
    scrollElement.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      scrollElement.removeEventListener('touchstart', onTouchStart);
      scrollElement.removeEventListener('touchmove', onTouchMove);
      scrollElement.removeEventListener('touchend', onTouchEnd);
      scrollElement.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [isMobile, isRefreshing, onRefresh, scrollRef]);

  if (!isMobile || !onRefresh) {
    return null;
  }

  const visible = isPulling || isRefreshing || pullDistance > 0;
  const progress = Math.min(1, pullDistance / PULL_THRESHOLD);
  const readyToRefresh = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'pointer-events-none fixed inset-x-0 z-40 flex justify-center transition-opacity duration-150',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      style={{
        top: 'calc(var(--header-height, 60px) + var(--impersonation-banner-height, 0px) + 0.25rem)',
      }}
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-full border border-border bg-background/95 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm',
          readyToRefresh && isPulling && 'text-primary',
        )}
        style={{
          transform: `translateY(${Math.max(0, pullDistance - 24)}px)`,
        }}
      >
        <LoaderCircle
          className={cn(
            'size-3.5 shrink-0',
            (isRefreshing || (isPulling && readyToRefresh)) && 'animate-spin text-primary',
          )}
          style={{
            transform: isPulling && !isRefreshing
              ? `rotate(${progress * 180}deg)`
              : undefined,
          }}
        />
        <span>
          {isRefreshing
            ? t('common.refreshing')
            : readyToRefresh
              ? t('common.release_to_refresh')
              : t('common.pull_to_refresh')}
        </span>
      </div>
    </div>
  );
}
