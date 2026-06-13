import { useIsMobile } from '@/hooks/use-mobile';
import { useViewMode } from '@/hooks/use-view-mode';
import { shouldUseGridInfiniteScroll } from '@/lib/grid-infinite-scroll';
import type { ViewPreferenceKey } from '@/types/view-mode';

export function useGridViewMode(preferenceKey: ViewPreferenceKey) {
  const isMobile = useIsMobile();
  const { viewMode, setViewMode } = useViewMode(preferenceKey);

  return {
    viewMode,
    setViewMode,
    isMobile,
    infiniteScrollEnabled: shouldUseGridInfiniteScroll(isMobile, viewMode),
  };
}
