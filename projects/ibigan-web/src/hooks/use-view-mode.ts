import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getData, setData } from '@/lib/storage';
import { userPreferencesService } from '@/services/user-preferences.service';
import {
  defaultViewMode,
  isViewMode,
  type ViewMode,
  type ViewPreferenceKey,
} from '@/types/view-mode';

const LOCAL_CACHE_PREFIX = 'user-preferences:';

type PersistMode = 'api' | 'local';

export function useViewMode(
  preferenceKey: ViewPreferenceKey,
  options?: { persist?: PersistMode },
) {
  const persist = options?.persist ?? 'api';
  const isMobile = useIsMobile();
  const [viewMode, setViewModeState] = useState<ViewMode>(() =>
    defaultViewMode(isMobile),
  );
  const [isReady, setIsReady] = useState(false);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreference() {
      const cached = getData<string>(`${LOCAL_CACHE_PREFIX}${preferenceKey}`);
      if (isViewMode(cached)) {
        setViewModeState(cached);
      }

      if (persist === 'local') {
        if (!isViewMode(cached)) {
          setViewModeState(defaultViewMode(isMobile));
        }
        if (!cancelled) setIsReady(true);
        return;
      }

      try {
        const response = await userPreferencesService.get();
        const saved = response.data.result[preferenceKey];
        if (!cancelled && isViewMode(saved)) {
          setViewModeState(saved);
          setData(`${LOCAL_CACHE_PREFIX}${preferenceKey}`, saved);
        } else if (!cancelled && !isViewMode(cached)) {
          setViewModeState(defaultViewMode(isMobile));
        }
      } catch {
        if (!cancelled && !isViewMode(cached)) {
          setViewModeState(defaultViewMode(isMobile));
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    void loadPreference();

    return () => {
      cancelled = true;
    };
  }, [isMobile, persist, preferenceKey]);

  const persistPreference = useCallback(
    (mode: ViewMode) => {
      setData(`${LOCAL_CACHE_PREFIX}${preferenceKey}`, mode);

      if (persist === 'local') {
        return;
      }

      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = window.setTimeout(() => {
        void userPreferencesService.update({ [preferenceKey]: mode }).catch(() => undefined);
      }, 400);
    },
    [persist, preferenceKey],
  );

  const setViewMode = useCallback(
    (mode: ViewMode) => {
      setViewModeState(mode);
      persistPreference(mode);
    },
    [persistPreference],
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  return {
    viewMode: isMobile && viewMode === 'table' ? 'cards' : viewMode,
    setViewMode,
    isReady,
    isMobile,
    savedViewMode: viewMode,
  };
}
