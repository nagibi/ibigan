import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/types/view-mode';
import { GridInfiniteScrollSentinel } from './grid-infinite-scroll-sentinel';
import { GridCardsSkeleton, GridEmptyState } from './grid-cards-skeleton';

export interface GridInfiniteScrollConfig {
  enabled: boolean;
  hasMore: boolean;
  loading?: boolean;
  loadingMore?: boolean;
  onLoadMore: () => void;
  loadedCount?: number;
  total?: number;
}

export interface DataViewProps {
  viewMode: ViewMode;
  loading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  skeletonCount?: number;
  tableView: ReactNode;
  listView: ReactNode;
  cardView: ReactNode;
  className?: string;
  infiniteScroll?: GridInfiniteScrollConfig;
}

export function DataView({
  viewMode,
  loading = false,
  isEmpty = false,
  emptyMessage,
  skeletonCount = 5,
  tableView,
  listView,
  cardView,
  className,
  infiniteScroll,
}: DataViewProps) {
  const { t } = useTranslation();
  const resolvedEmptyMessage = emptyMessage ?? t('grid.empty');
  const showInitialLoading = loading && !infiniteScroll?.loadingMore;

  if (viewMode === 'table') {
    return (
      <div className={cn('flex h-0 min-h-0 min-w-0 flex-1 flex-col overflow-hidden', className)}>
        {tableView}
      </div>
    );
  }

  if (showInitialLoading) {
    return (
      <div className={cn(viewMode === 'list' ? 'min-w-0 w-full overflow-x-hidden p-4' : 'min-w-0 w-full overflow-x-hidden max-xl:py-3 xl:p-0', className)}>
        <GridCardsSkeleton count={skeletonCount} variant={viewMode === 'list' ? 'list' : 'cards'} />
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={cn('min-w-0 w-full overflow-x-hidden max-xl:px-0 max-xl:py-2 xl:p-4', className)}>
        <GridEmptyState message={resolvedEmptyMessage} />
      </div>
    );
  }

  const infiniteSentinel = infiniteScroll?.enabled ? (
    <GridInfiniteScrollSentinel
      hasMore={infiniteScroll.hasMore}
      loading={infiniteScroll.loading || infiniteScroll.loadingMore}
      onLoadMore={infiniteScroll.onLoadMore}
      loadedCount={infiniteScroll.loadedCount}
      total={infiniteScroll.total}
    />
  ) : null;

  return (
    <div className={cn(viewMode === 'list' ? 'min-w-0 w-full max-w-full overflow-x-hidden p-2' : 'min-w-0 w-full max-w-full overflow-x-hidden max-xl:py-3 xl:p-0', className)}>
      {viewMode === 'list' ? listView : cardView}
      {infiniteSentinel}
    </div>
  );
}
