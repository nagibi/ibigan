import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router';
import { useLoadingBar } from 'react-top-loading-bar';
import {
  getApiPendingCount,
  subscribeApiLoading,
} from '@/lib/api-loading-bar';

export function GlobalLoadingBar() {
  const { start, complete } = useLoadingBar({
    color: 'var(--color-primary)',
    shadow: false,
    waitingTime: 200,
    transitionTime: 200,
    loaderSpeed: 400,
    height: 3,
  });

  const location = useLocation();
  const apiPending = useSyncExternalStore(
    subscribeApiLoading,
    getApiPendingCount,
    getApiPendingCount,
  );

  const [firstLoad, setFirstLoad] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    setFirstLoad(false);
  }, []);

  useEffect(() => {
    if (firstLoad) return;

    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), 150);

    return () => clearTimeout(timer);
  }, [location, firstLoad]);

  useEffect(() => {
    if (apiPending > 0 || routeLoading) {
      start('continuous');
      return;
    }

    complete();
  }, [apiPending, routeLoading, start, complete]);

  return null;
}
