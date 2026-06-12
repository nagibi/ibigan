import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SCROLL_ROOT_SELECTOR = '.page-content-scroll';

export function GridInfiniteScrollSentinel({
  hasMore,
  loading,
  onLoadMore,
  loadedCount,
  total,
  className,
}: {
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
  loadedCount?: number;
  total?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading) return undefined;

    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const root = document.querySelector<HTMLElement>(SCROLL_ROOT_SELECTOR);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      {
        root,
        rootMargin: '120px 0px',
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore && !loading) {
    if (loadedCount != null && total != null && total > 0) {
      return (
        <p className={cn('px-4 py-3 text-center text-xs text-muted-foreground', className)}>
          {t('grid.infinite.loaded_count', { loaded: loadedCount, total })}
        </p>
      );
    }

    return null;
  }

  return (
    <div
      ref={sentinelRef}
      className={cn('flex flex-col items-center justify-center gap-2 px-4 py-4', className)}
      aria-live="polite"
    >
      {loading ? (
        <>
          <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{t('grid.infinite.loading_more')}</span>
        </>
      ) : (
        <span className="text-xs text-muted-foreground">{t('grid.infinite.load_more')}</span>
      )}
      {loadedCount != null && total != null ? (
        <span className="text-[0.6875rem] text-muted-foreground">
          {t('grid.infinite.loaded_count', { loaded: loadedCount, total })}
        </span>
      ) : null}
    </div>
  );
}
