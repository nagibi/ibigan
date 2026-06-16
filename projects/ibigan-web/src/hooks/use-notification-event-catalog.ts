import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  groupEventsByCategory,
  resolveActiveNotificationCatalog,
} from '@/lib/notification-catalog-merge';
import { getNotificationEventCatalog } from '@/lib/notification-events';
import { notificationEventsService } from '@/services/notification-events.service';

export function useNotificationEventCatalog() {
  const localCatalog = useMemo(() => getNotificationEventCatalog(), []);

  const query = useQuery({
    queryKey: ['notification-events'],
    queryFn: () => notificationEventsService.list(),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const remoteCatalog = query.data?.data.result;
  const useRemote = query.isSuccess && Boolean(remoteCatalog?.length);

  const catalog = useMemo(
    () => resolveActiveNotificationCatalog(remoteCatalog, useRemote),
    [remoteCatalog, useRemote],
  );

  const eventsByCategory = useMemo(() => groupEventsByCategory(catalog), [catalog]);

  return {
    catalog,
    eventsByCategory,
    localCatalog,
    isLoading: query.isLoading,
    isRemote: useRemote,
    error: query.error,
  };
}
