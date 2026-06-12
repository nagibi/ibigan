import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export interface GridRecordCountInfo {
  total: number;
  loaded?: number;
}

export function getGridRecordCount(
  total: number,
  loadedCount: number,
  infiniteScrollEnabled?: boolean,
): GridRecordCountInfo {
  if (infiniteScrollEnabled && loadedCount < total) {
    return { total, loaded: loadedCount };
  }

  return { total };
}

export function formatGridRecordCount(
  { total, loaded }: GridRecordCountInfo,
  t: TFunction,
) {
  if (loaded != null && loaded < total) {
    return t('grid.infinite.loaded_count', { loaded, total });
  }

  if (total === 1) {
    return t('grid.record_total_one');
  }

  return t('grid.record_total', { count: total });
}

export function GridMobileRecordCountBar({
  total,
  loaded,
  className,
}: GridRecordCountInfo & { className?: string }) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return (
    <div className={cn('border-t border-border px-3 py-1.5 xl:hidden', className)}>
      <p className="text-xs text-muted-foreground">
        {formatGridRecordCount({ total, loaded }, t)}
      </p>
    </div>
  );
}
